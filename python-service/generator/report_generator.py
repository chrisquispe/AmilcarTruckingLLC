import io
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, HRFlowable


BRAND_DARK   = colors.HexColor("#1a2332")
BRAND_ACCENT = colors.HexColor("#2563eb")
LIGHT_GRAY   = colors.HexColor("#f1f5f9")
MID_GRAY     = colors.HexColor("#64748b")

# Row height used for height estimation (inches)
_ROW_H = 0.20


def _estimate_page_height(num_regular: int, num_fuel: int) -> float:
    """
    Return the minimum page height (in points) needed to fit all content on
    one page.  We pad generously so the PDF never wraps to a second page.
    """
    header_block  = 2.4 * inch      # company header + info table
    section_head  = 0.35 * inch     # "Ticket Detail" / "Fuel" label
    table_row     = _ROW_H * inch   # each data row + header row

    regular_block = section_head + table_row * (num_regular + 1)  # +1 for col header
    fuel_block    = (section_head + table_row * (num_fuel + 1)) if num_fuel else 0

    totals_block  = 1.4 * inch
    margins       = 1.6 * inch      # top + bottom

    needed = header_block + regular_block + fuel_block + totals_block + margins
    return max(letter[1], needed)   # never smaller than a standard letter page


def generate_report_pdf(report_data: dict) -> bytes:
    """
    Build a single-page driver pay report.

    Expected report_data keys:
      reportDate, driverName, truckNumber,
      tickets (list), mainTotal, fuelTotal,
      driverPercentage, driverPay, includeFuelInTotal
    """
    tickets       = report_data.get("tickets", [])
    regular_tix   = [t for t in tickets if not t.get("isFuelSurcharge")]
    fuel_tix      = [t for t in tickets if t.get("isFuelSurcharge")]

    page_width    = letter[0]
    page_height   = _estimate_page_height(len(regular_tix), len(fuel_tix))

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=(page_width, page_height),
        rightMargin=0.65 * inch,
        leftMargin=0.65 * inch,
        topMargin=0.65 * inch,
        bottomMargin=0.65 * inch,
    )

    story = []

    # ── Company header ────────────────────────────────────────────────────────
    story.append(Paragraph("AMILCAR TRUCKING LLC", ParagraphStyle(
        "company", fontSize=18, fontName="Helvetica-Bold",
        textColor=BRAND_DARK, spaceAfter=2,
    )))
    story.append(Paragraph("Driver Payment Report", ParagraphStyle(
        "sub", fontSize=9, fontName="Helvetica",
        textColor=MID_GRAY, spaceAfter=6,
    )))
    story.append(HRFlowable(width="100%", thickness=2, color=BRAND_ACCENT, spaceAfter=8))

    # ── Report meta ───────────────────────────────────────────────────────────
    report_date = report_data.get("reportDate", "")
    driver_name = report_data.get("driverName", "Unassigned")
    truck_number = report_data.get("truckNumber", "—")

    info_data = [
        ["Report Date:", report_date, "Driver:", driver_name],
        ["Truck:",       truck_number, "",        ""],
    ]
    col_w = [1.1*inch, 1.9*inch, 0.9*inch, 2.4*inch]
    info_tbl = Table(info_data, colWidths=col_w)
    info_tbl.setStyle(TableStyle([
        ("FONTNAME",    (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTNAME",    (2, 0), (2, -1), "Helvetica-Bold"),
        ("FONTSIZE",    (0, 0), (-1, -1), 9),
        ("TEXTCOLOR",   (0, 0), (0, -1), BRAND_DARK),
        ("TEXTCOLOR",   (2, 0), (2, -1), BRAND_DARK),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
    ]))
    story.append(info_tbl)
    story.append(Spacer(1, 10))

    # ── Ticket table builder ──────────────────────────────────────────────────
    def make_ticket_table(rows_data: list, is_fuel: bool) -> Table:
        header_color = colors.HexColor("#475569") if is_fuel else BRAND_DARK
        header = ["Ticket Date", "Ticket #", "Quantity", "Pay Rate", "Pay Amount"]
        tbl_data = [header]
        for t in rows_data:
            tbl_data.append([
                t.get("ticketDate")   or "—",
                t.get("ticketNumber") or "—",
                f"{float(t['quantity']):.3f}"  if t.get("quantity")  is not None else "—",
                f"${float(t['payRate']):.2f}"  if t.get("payRate")   is not None else "—",
                f"${float(t['payAmount']):.2f}"if t.get("payAmount") is not None else "—",
            ])

        col_widths = [1.1*inch, 1.15*inch, 0.95*inch, 1.1*inch, 1.1*inch]
        tbl = Table(tbl_data, colWidths=col_widths, repeatRows=1)
        tbl.setStyle(TableStyle([
            ("BACKGROUND",    (0, 0), (-1, 0), header_color),
            ("TEXTCOLOR",     (0, 0), (-1, 0), colors.white),
            ("FONTNAME",      (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE",      (0, 0), (-1, -1), 8),
            ("ALIGN",         (2, 0), (-1, -1), "RIGHT"),
            ("ROWBACKGROUNDS",(0, 1), (-1, -1), [colors.white, LIGHT_GRAY]),
            ("GRID",          (0, 0), (-1, -1), 0.4, colors.HexColor("#cbd5e1")),
            ("TOPPADDING",    (0, 0), (-1, -1), 3),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ]))
        return tbl

    # ── Regular tickets ───────────────────────────────────────────────────────
    if regular_tix:
        story.append(Paragraph("Ticket Detail", ParagraphStyle(
            "sec", fontSize=10, fontName="Helvetica-Bold",
            textColor=BRAND_DARK, spaceAfter=4,
        )))
        story.append(make_ticket_table(regular_tix, is_fuel=False))
        story.append(Spacer(1, 10))

    # ── Totals ────────────────────────────────────────────────────────────────
    main_total  = float(report_data.get("mainTotal",  0) or 0)
    driver_pay  = float(report_data.get("driverPay",  0) or 0)

    story.append(HRFlowable(width="100%", thickness=0.5,
                             color=colors.HexColor("#cbd5e1"), spaceAfter=6))

    totals_data = [
        ["Main Total:",    f"${main_total:,.2f}"],
        ["Final Driver Pay:", f"${driver_pay:,.2f}"],
    ]
    totals_tbl = Table(totals_data, colWidths=[2.8*inch, 1.8*inch])
    totals_tbl.setStyle(TableStyle([
        ("FONTNAME",      (0, 0), (0, 0), "Helvetica-Bold"),
        ("FONTSIZE",      (0, 0), (-1, 0), 9),
        ("ALIGN",         (1, 0), (1, -1), "RIGHT"),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        # Highlight Final Driver Pay row
        ("BACKGROUND",    (0, 1), (-1, 1), BRAND_ACCENT),
        ("TEXTCOLOR",     (0, 1), (-1, 1), colors.white),
        ("FONTNAME",      (0, 1), (-1, 1), "Helvetica-Bold"),
        ("FONTSIZE",      (0, 1), (-1, 1), 11),
        ("TOPPADDING",    (0, 1), (-1, 1), 6),
        ("BOTTOMPADDING", (0, 1), (-1, 1), 6),
    ]))
    story.append(totals_tbl)

    doc.build(story)
    return buffer.getvalue()
