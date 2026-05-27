from dataclasses import dataclass, field
from typing import Optional


@dataclass
class ParsedTicket:
    truck_number: str
    ticket_number: str
    ticket_date: Optional[str]   # ISO format string "YYYY-MM-DD"
    quantity: Optional[float]
    pay_amount: Optional[float]
    pay_rate: Optional[float]
    is_fuel_surcharge: bool = False


@dataclass
class ParsedTruckSection:
    truck_number: str
    tickets: list = field(default_factory=list)


@dataclass
class ParseResult:
    trucks: list = field(default_factory=list)   # list of ParsedTruckSection
    parse_errors: list = field(default_factory=list)
