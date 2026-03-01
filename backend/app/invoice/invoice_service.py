import logging
import os
import base64
import requests
import uuid
from typing import Dict, Any
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.core.config import get_settings
from app.models.order import Order
from app.models.user import User
from app.models.order_item import OrderItem
from app.models.medicine import Medicine

from app.invoice.invoice import generate_invoice_pdf

logger = logging.getLogger(__name__)
BREVO_URL = "https://api.brevo.com/v3/smtp/email"


# =========================================================
# INTERNAL HELPERS
# =========================================================

def _build_invoice_payload(order: Order, user: User, items: list[Dict[str, Any]]):
    return {
        "order_id": str(order.id),
        "user_id": order.user_name or (user.name if user else "Customer"),
        "status": order.status.value,
        "timestamp": order.created_at,
        "items": items,
        "total_bill": order.total_amount,
        "payment_method": "Cash on Delivery",
    }


def _fetch_order_items(db: Session, order_id: uuid.UUID):
    rows = (
        db.query(OrderItem, Medicine)
        .join(Medicine, Medicine.id == OrderItem.medicine_id)
        .filter(OrderItem.order_id == order_id)
        .all()
    )

    items = []
    for item, medicine in rows:
        items.append({
            "medicine_name": medicine.name,
            "quantity": item.quantity,
            "price": float(item.price),
            "subtotal": float(item.price * item.quantity),
        })

    return items


def _send_email_with_attachment(
    api_key: str, to_email: str, subject: str, html_content: str, encoded_pdf: str, filename: str
):
    headers = {
        "accept": "application/json",
        "api-key": api_key,
        "content-type": "application/json",
    }

    payload = {
        "sender": {
            "name": "SentinelRx-AI",
            "email": "ainpharmacyofficial@gmail.com",
        },
        "to": [{"email": to_email}],
        "subject": subject,
        "htmlContent": html_content,
        "attachment": [
            {
                "content": encoded_pdf,
                "name": filename,
            }
        ],
    }

    response = requests.post(BREVO_URL, json=payload, headers=headers)

    if response.status_code != 201:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Email sending failed: {response.text}",
        )


# =========================================================
# MAIN SERVICE FUNCTION
# =========================================================

def generate_and_send_invoice(db: Session, order_id: uuid.UUID) -> None:
    """
    Generate invoice PDF from Order, send order confirmation email with invoice via Brevo.
    Raises HTTPException on failure.
    """
    settings = get_settings()
    if not settings.brevo_api_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Email service not configured. Set BREVO_API_KEY in .env",
        )

    # -----------------------------------------------------
    # 1️⃣ Fetch Order
    # -----------------------------------------------------
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    user = db.query(User).filter(User.id == order.user_id).first()
    if not user or not user.email:
        raise HTTPException(status_code=400, detail="User email not found")

    # -----------------------------------------------------
    # 2️⃣ Fetch Order Items
    # -----------------------------------------------------
    items = _fetch_order_items(db, order.id)

    # -----------------------------------------------------
    # 3️⃣ Build Invoice Data
    # -----------------------------------------------------
    invoice_data = _build_invoice_payload(order, user, items)

    # -----------------------------------------------------
    # 4️⃣ Generate PDF
    # -----------------------------------------------------
    pdf_path = generate_invoice_pdf(invoice_data)

    if not os.path.exists(pdf_path):
        raise HTTPException(status_code=500, detail="Invoice generation failed")

    # -----------------------------------------------------
    # 5️⃣ Encode PDF
    # -----------------------------------------------------
    with open(pdf_path, "rb") as f:
        encoded_pdf = base64.b64encode(f.read()).decode()

    # -----------------------------------------------------
    # 6️⃣ Build Email HTML
    # -----------------------------------------------------
    html_content = f"""
   <!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Order Confirmation</title>
</head>

<body style="margin:0; padding:0; background-color:#f4f6f9; font-family: Arial, Helvetica, sans-serif;">

  <table align="center" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px; margin:40px auto; background:#ffffff; border-radius:10px; overflow:hidden; box-shadow:0 8px 24px rgba(0,0,0,0.08);">

    <!-- Header -->
    <tr>
      <td style="background:linear-gradient(135deg, #0f172a, #1e3a8a); padding:25px; text-align:center;">
        <h1 style="color:#ffffff; margin:0; font-size:22px; letter-spacing:0.5px;">
          SentinelRx-AI
        </h1>
        <p style="color:#cbd5e1; margin:5px 0 0; font-size:13px;">
          Intelligent Pharmacy Management
        </p>
      </td>
    </tr>

    <!-- Body Content -->
    <tr>
      <td style="padding:30px; color:#1f2937;">

        <h2 style="margin-top:0; color:#16a34a;">
          ✅ Order Confirmed
        </h2>

        <p style="font-size:15px;">
          Dear <strong>{user.name}</strong>,
        </p>

        <p style="font-size:15px; line-height:1.6;">
          Thank you for choosing <strong>SentinelRx-AI</strong>.  
          Your order has been successfully confirmed and is now being processed.
        </p>

        <!-- Order Details Box -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0; background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px;">
          <tr>
            <td style="padding:15px;">

              <p style="margin:5px 0; font-size:14px;">
                <strong>Order ID:</strong> 
                <span style="color:#1e3a8a;">{order.id}</span>
              </p>

              <p style="margin:5px 0; font-size:14px;">
                <strong>Total Amount:</strong> 
                <span style="color:#16a34a; font-size:16px;">₹ {order.total_amount}</span>
              </p>

            </td>
          </tr>
        </table>

        <p style="font-size:14px; line-height:1.6;">
          📎 Your invoice has been attached to this email for your records.
        </p>

        <p style="font-size:14px; line-height:1.6;">
          If you have any questions regarding your order, please feel free to contact our support team.
        </p>

        <br>

        <p style="font-size:14px;">
          Best Regards,<br>
          <strong style="color:#1e3a8a;">SentinelRx-AI Team</strong>
        </p>

      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="background:#f1f5f9; padding:20px; text-align:center; font-size:12px; color:#64748b;">
        © 2026 SentinelRx-AI. All rights reserved.<br>
        AI-Powered Secure Pharmacy System
      </td>
    </tr>

  </table>

</body>
</html>"""

    # -----------------------------------------------------
    # 7️⃣ Send Email
    # -----------------------------------------------------
    _send_email_with_attachment(
        api_key=settings.brevo_api_key,
        to_email=user.email,
        subject=f"Order Confirmed – Invoice #{str(order.id)[:8]} | SentinelRx-AI",
        html_content=html_content,
        encoded_pdf=encoded_pdf,
        filename=f"SentinelRx_Invoice_{order.id}.pdf",
    )

    # -----------------------------------------------------
    # 8️⃣ Cleanup
    # -----------------------------------------------------
    if os.path.exists(pdf_path):
        os.remove(pdf_path)


def try_send_order_confirmation_email(db: Session, order_id: uuid.UUID) -> bool:
    """
    Send order confirmation email with invoice. Does not raise – logs errors.
    Returns True if sent successfully, False otherwise.
    Use after order creation; failures do not affect the order.
    """
    try:
        generate_and_send_invoice(db, order_id)
        logger.info("Order confirmation email sent for order %s", order_id)
        return True
    except HTTPException as e:
        logger.warning("Invoice email failed for order %s: %s", order_id, e.detail)
        return False
    except Exception as e:
        logger.exception("Invoice email failed for order %s: %s", order_id, e)
        return False