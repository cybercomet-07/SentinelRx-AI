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
    <html>
      <body style="font-family:Arial;">
        <h2>Order Confirmed ✅</h2>
        <p>Dear {user.name},</p>
        <p>Your order <strong>{order.id}</strong> has been confirmed.</p>
        <p>Total Amount: <strong>₹ {order.total_amount}</strong></p>
        <p>Please find your invoice attached.</p>
        <br>
        <p>Regards,<br>SentinelRx-AI Team</p>
      </body>
    </html>
    """

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