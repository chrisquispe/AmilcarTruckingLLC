import re
import pdfplumber
from .models import ParsedTicket, ParsedTruckSection, ParseResult

TRUCK_HEADER_RE = re.compile(r"^(TRUX\d+)\s*:", re.IGNORECASE)
DATE_RE         = re.compile(r"^\d{1,2}/\d{1,2}/\d{2,4}$")
FUEL_KEYWORDS   = {"fuel surcharge", "fsc pay only"}


def _clean(val: str | None) -> str:
    return (val or "").strip()


def _normalize_date(raw: str) -> str | None:
    try:
        parts = raw.strip().split("/")
        if len(parts) == 3:
            m, d, y = parts
            if len(y) == 2:
                y = "20" + y
            return f"{int(y):04d}-{int(m):02d}-{int(d):02d}"
    except Exception:
        pass
    return None


def _parse_float(val: str | None) -> float | None:
    try:
        return float(_clean(val).replace(",", "").replace("$", ""))
    except (ValueError, AttributeError):
        return None


def _is_column_header(cells: list) -> bool:
    first = _clean(cells[0]).lower()
    return "ticket" in first and "date" in first


def _is_subtotal(cells: list) -> bool:
    return "subtotal" in _clean(cells[0]).lower()


def parse_pdf(file_path: str) -> ParseResult:
    """
    Uses extract_tables() for reliable row detection (never misses rows even
    when Order/Product text is very long).

    Value extraction uses the LAST three cells of each row:
      cells[-1] = Amount (pay_amount)   — always in the rightmost column
      cells[-2] = Pay Rate              — always second-to-last
      cells[-3] = QTY                   — third-to-last

    The only row we skip is one where pay_amount cannot be parsed at all, since
    pay_amount is what drives the driver pay calculation.  A garbled quantity
    in cells[-3] (which can happen when pdfplumber merges adjacent cells) does
    NOT cause the row to be dropped — it just shows an unusual quantity in the
    table display while the pay total remains correct.
    """
    result = ParseResult()
    current_truck: ParsedTruckSection | None = None

    try:
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                tables = page.extract_tables()
                for table in tables:
                    for row in table:
                        cells = [c if c is not None else "" for c in row]
                        if not any(c.strip() for c in cells):
                            continue

                        first = _clean(cells[0])

                        if _is_column_header(cells) or _is_subtotal(cells):
                            continue

                        # Truck section header e.g. "TRUX35367 : Amilcar Trucking"
                        truck_match = TRUCK_HEADER_RE.match(first)
                        if truck_match:
                            truck_number = truck_match.group(1).upper()
                            existing = next(
                                (t for t in result.trucks if t.truck_number == truck_number),
                                None,
                            )
                            current_truck = existing or ParsedTruckSection(truck_number=truck_number)
                            if not existing:
                                result.trucks.append(current_truck)
                            continue

                        if current_truck is None:
                            continue

                        # Data row: first cell must be a date
                        if not DATE_RE.match(first):
                            continue

                        # Always the last three columns regardless of total column count
                        pay_amount = _parse_float(cells[-1])
                        pay_rate   = _parse_float(cells[-2])
                        quantity   = _parse_float(cells[-3]) if len(cells) >= 3 else None

                        # Only skip the row if pay_amount is completely unreadable
                        if pay_amount is None:
                            result.parse_errors.append(
                                f"Skipped row (no amount): {' '.join(c.strip() for c in cells)[:120]}"
                            )
                            continue

                        ticket_date   = _normalize_date(first)
                        ticket_number = _clean(cells[1]) if len(cells) > 1 else ""

                        # Fuel detection: check all cells for keywords
                        row_lower = " ".join(c.lower() for c in cells)
                        is_fuel   = any(kw in row_lower for kw in FUEL_KEYWORDS)

                        current_truck.tickets.append(
                            ParsedTicket(
                                truck_number=current_truck.truck_number,
                                ticket_number=ticket_number,
                                ticket_date=ticket_date,
                                quantity=quantity,
                                pay_rate=pay_rate,
                                pay_amount=pay_amount,
                                is_fuel_surcharge=is_fuel,
                            )
                        )

    except Exception as e:
        result.parse_errors.append(str(e))

    return result


def parse_result_to_dict(result: ParseResult) -> dict:
    trucks = []
    for section in result.trucks:
        tickets = [
            {
                "truckNumber":     t.truck_number,
                "ticketNumber":    t.ticket_number,
                "ticketDate":      t.ticket_date,
                "quantity":        t.quantity,
                "payRate":         t.pay_rate,
                "payAmount":       t.pay_amount,
                "isFuelSurcharge": t.is_fuel_surcharge,
            }
            for t in section.tickets
        ]
        trucks.append({"truckNumber": section.truck_number, "tickets": tickets})
    return {"trucks": trucks, "parseErrors": result.parse_errors}
