"""Read-only source boundary. No live adapters or credentials configured."""

from dataclasses import dataclass
from datetime import datetime
from typing import Any, Iterable, Protocol


@dataclass(frozen=True)
class SourceRecord:
    source: str
    original_id: str
    business_at: datetime
    synced_at: datetime
    payload: dict[str, Any]


class ReadOnlySource(Protocol):
    def fetch(self, since: datetime) -> Iterable[SourceRecord]: ...


SOURCE_RULES = {
    "sapo": "Orders, sales, refunds; source amounts retained",
    "kiotviet": "Purchases and inventory movements",
    "onedrive": "Accounting authority; legacy KG means cash collection",
    "price_system": "Authoritative aging and valuation; separate auto-sale approval system",
}


class DemoImportLedger:
    """Testable idempotency contract, not a live sync implementation."""

    def __init__(self):
        self.rows = {}
        self.closed = set()
        self.conflicts = set()

    def import_record(self, record: SourceRecord):
        key = (record.source, record.original_id)
        old = self.rows.get(key)
        if old and old.payload == record.payload and old.business_at == record.business_at:
            return "unchanged"
        if key in self.closed:
            self.conflicts.add(key)
            return "blocked_closed_history"
        self.rows[key] = record
        return "updated" if old else "inserted"

    def can_close(self):
        return not self.conflicts


@dataclass(frozen=True)
class PriceEvaluation:
    """External Price System output contract; no pricing logic implemented here."""

    internal_item_id: str
    baoq_sku: str
    policy_version: str
    approval_state: str
    evaluated_at: datetime
    source_timestamp: datetime
    provenance: dict[str, Any]
    purchase_price_vnd: int
    recommended_price_vnd: int
    ready_to_sale_at: datetime
    # Superseding UI specification: earliest website OR social publication after photography.
    # Reuse authoritative existing date; never derive it from stock receipt date.
    margin_basis: str = "selling_price"
    cost_basis: str = "item_purchase_price_only"
    source_id: str = ""
    external_reference: str = ""
