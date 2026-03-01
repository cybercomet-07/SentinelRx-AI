import os
import tempfile
from datetime import datetime
from decimal import Decimal
from typing import Dict, Any, List

from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    HRFlowable,
)
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase import pdfmetrics


# =========================================================
# GLOBAL BRAND CONFIGURATION
# =========================================================

BRAND_DARK = colors.HexColor("#0f172a")
BRAND_BLUE = colors.HexColor("#2563eb")
SUCCESS_GREEN = colors.HexColor("#10b981")
SOFT_GRAY = colors.HexColor("#f1f5f9")
LIGHT_BORDER = colors.HexColor("#e2e8f0")

DEFAULT_GST_PERCENTAGE = Decimal("0.05")


# =========================================================
# INTERNAL HELPERS
# =========================================================

def _register_base_font() -> str:
    """
    Register Unicode-safe font.
    Falls back to Helvetica if unavailable.
    """
    try:
        pdfmetrics.registerFont(TTFont("NotoSans", "NotoSans-Regular.ttf"))
        return "NotoSans"
    except Exception:
        return "Helvetica"


def _build_styles(base_font: str):
    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        "InvoiceTitle",
        parent=styles["Heading1"],
        fontName=base_font,
        fontSize=22,
        textColor=BRAND_DARK,
        spaceAfter=8,
    )

    subtitle_style = ParagraphStyle(
        "InvoiceSubtitle",
        parent=styles["Normal"],
        fontName=base_font,
        fontSize=11,
        textColor=colors.grey,
    )

    normal_style = ParagraphStyle(
        "InvoiceNormal",
        parent=styles["Normal"],
        fontName=base_font,
        fontSize=11,
        textColor=BRAND_DARK,
    )

    return title_style, subtitle_style, normal_style


def _safe_decimal(value: Any) -> Decimal:
    return Decimal(str(value)).quantize(Decimal("0.01"))


def _format_currency(value: Decimal) -> str:
    return f"₹ {value:.2f}"


# =========================================================
# MAIN REPORT GENERATOR
# =========================================================

def generate_invoice_pdf(order_data: Dict[str, Any]) -> str:
    """
    Production-Grade Invoice Generator
    Structured, deterministic, enterprise-compliant layout.
    """

    # -----------------------------------------------------
    # 1️⃣ TEMP FILE CONFIGURATION
    # -----------------------------------------------------
    temp_dir = tempfile.gettempdir()
    file_path = os.path.join(
        temp_dir,
        f"SentinelRx_AI_Invoice_{order_data['order_id']}.pdf",
    )

    doc = SimpleDocTemplate(
        file_path,
        pagesize=A4,
        rightMargin=40,
        leftMargin=40,
        topMargin=50,
        bottomMargin=40,
    )

    elements: List = []

    # -----------------------------------------------------
    # 2️⃣ FONT & STYLE INITIALIZATION
    # -----------------------------------------------------
    base_font = _register_base_font()
    title_style, subtitle_style, normal_style = _build_styles(base_font)

    # -----------------------------------------------------
    # 3️⃣ HEADER SECTION
    # -----------------------------------------------------
    elements.append(Paragraph("🧾 SentinelRx-AI", title_style))
    elements.append(
        Paragraph(
            "AI-Powered Pharmaceutical Intelligence Platform",
            subtitle_style,
        )
    )
    elements.append(Spacer(1, 0.2 * inch))
    elements.append(HRFlowable(width="100%", thickness=2, color=BRAND_BLUE))
    elements.append(Spacer(1, 0.3 * inch))

    # -----------------------------------------------------
    # 4️⃣ META INFORMATION SECTION
    # -----------------------------------------------------
    order_time = order_data.get("timestamp")
    formatted_date = (
        order_time.strftime("%d %b %Y, %I:%M %p")
        if order_time
        else datetime.utcnow().strftime("%d %b %Y, %I:%M %p")
    )

    status = order_data.get("status", "Confirmed").capitalize()

    meta_rows = [
        ["Invoice ID", order_data["order_id"]],
        ["Order Date", formatted_date],
        ["Customer", order_data.get("user_id", "Guest User")],
        ["Payment Mode", order_data.get("payment_method", "Cash on Delivery")],
        ["Status", status],
    ]

    meta_table = Table(meta_rows, colWidths=[130, 330])
    meta_table.setStyle(
        TableStyle(
            [
                ("FONTNAME", (0, 0), (-1, -1), base_font),
                ("FONTSIZE", (0, 0), (-1, -1), 11),
                ("TEXTCOLOR", (0, 0), (-1, -1), BRAND_DARK),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
                ("LINEBELOW", (0, -1), (-1, -1), 1, LIGHT_BORDER),
            ]
        )
    )

    elements.append(meta_table)
    elements.append(Spacer(1, 0.4 * inch))

    # -----------------------------------------------------
    # 5️⃣ ITEM TABLE SECTION
    # -----------------------------------------------------
    table_data = [["#", "Medicine Name", "Qty", "Unit Price (₹)", "Subtotal (₹)"]]

    subtotal_total = Decimal("0.00")

    for idx, item in enumerate(order_data.get("items", []), start=1):
        quantity = int(item["quantity"])
        price = _safe_decimal(item["price"])
        line_total = _safe_decimal(item["subtotal"])

        subtotal_total += line_total

        table_data.append(
            [
                str(idx),
                str(item["medicine_name"]),
                str(quantity),
                f"{price:.2f}",
                f"{line_total:.2f}",
            ]
        )

    items_table = Table(table_data, colWidths=[30, 200, 60, 90, 90])
    items_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), BRAND_BLUE),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, -1), base_font),
                ("FONTSIZE", (0, 0), (-1, -1), 10),
                ("GRID", (0, 0), (-1, -1), 0.5, LIGHT_BORDER),
                ("ALIGN", (2, 1), (-1, -1), "CENTER"),
                ("BOTTOMPADDING", (0, 0), (-1, 0), 8),
            ]
        )
    )

    elements.append(items_table)
    elements.append(Spacer(1, 0.4 * inch))

    # -----------------------------------------------------
    # 6️⃣ BILLING SUMMARY SECTION
    # -----------------------------------------------------
    gst_amount = (subtotal_total * DEFAULT_GST_PERCENTAGE).quantize(Decimal("0.01"))
    grand_total = (subtotal_total + gst_amount).quantize(Decimal("0.01"))

    summary_rows = [
        ["Subtotal", _format_currency(subtotal_total)],
        [f"GST ({int(DEFAULT_GST_PERCENTAGE * 100)}%)", _format_currency(gst_amount)],
        ["Grand Total", _format_currency(grand_total)],
    ]

    summary_table = Table(summary_rows, colWidths=[350, 130])
    summary_table.setStyle(
        TableStyle(
            [
                ("FONTNAME", (0, 0), (-1, -1), base_font),
                ("FONTSIZE", (0, 0), (-1, -1), 11),
                ("TEXTCOLOR", (0, 0), (-1, -1), BRAND_DARK),
                ("ALIGN", (1, 0), (1, -1), "RIGHT"),
                ("BACKGROUND", (-2, -1), (-1, -1), SOFT_GRAY),
            ]
        )
    )

    elements.append(summary_table)
    elements.append(Spacer(1, 0.5 * inch))

    # -----------------------------------------------------
    # 7️⃣ FOOTER SECTION
    # -----------------------------------------------------
    elements.append(HRFlowable(width="100%", thickness=1, color=LIGHT_BORDER))
    elements.append(Spacer(1, 0.2 * inch))

    elements.append(
        Paragraph(
            "💊 Thank you for choosing SentinelRx-AI.",
            normal_style,
        )
    )

    elements.append(
        Paragraph(
            "For invoice assistance contact: support@sentinelrx-ai.com",
            subtitle_style,
        )
    )

    elements.append(
        Paragraph(
            "System-generated invoice. No physical signature required.",
            subtitle_style,
        )
    )

    # -----------------------------------------------------
    # 8️⃣ BUILD DOCUMENT
    # -----------------------------------------------------
    doc.build(elements)

    return file_path
