"""Synthetic fixtures only. Integer VND; never a replacement accounting engine."""

from collections import defaultdict
from typing import Any

AS_OF = "2026-10-19T09:00:00Z"
TRANSACTIONS: list[dict[str, Any]] = [
    dict(
        id=f"DEMO-S{i:03}",
        source="demo:sapo",
        original_id=f"S{i:03}",
        business_at=f"2026-10-{day:02}T10:00:00+07:00",
        synced_at=AS_OF,
        channel=channel,
        sale=sale,
        amount=amount,
        cost=cost,
        sku=sku,
        kind="refund" if amount < 0 else "sale",
    )
    for i, (day, channel, sale, amount, cost, sku) in enumerate(
        [
            (2, "Cửa hàng", "An", 45000000, 30000000, "D001"),
            (4, "Online", "Bình", 30000000, 21000000, "D002"),
            (6, "Cửa hàng", "An", 25000000, 17000000, "D003"),
            (8, "Đối tác", "Chi", 20000000, 14000000, "D004"),
            (12, "Online", "Bình", 40000000, 28000000, "D005"),
            (15, "Cửa hàng", "Chi", 35000000, 24000000, "D006"),
            (16, "Online", "Bình", -5000000, -3500000, "D002"),
        ],
        1,
    )
]
COSTS: list[dict[str, Any]] = [
    dict(id="DEMO-C01", category="Mặt bằng", amount=12000000),
    dict(id="DEMO-C02", category="Nhân sự", amount=15000000),
    dict(id="DEMO-C03", category="Marketing", amount=5000000),
]
INVENTORY: list[dict[str, Any]] = [
    dict(
        id=f"DEMO-I{i}",
        sku=f"D10{i}",
        name=name,
        age_days=age,
        value=value,
        source="demo:price-system",
        original_id=f"I{i}",
        business_at=AS_OF,
        synced_at=AS_OF,
    )
    for i, (name, age, value) in enumerate(
        [
            ("Túi da • mẫu A", 25, 24000000),
            ("Đồng hồ • mẫu B", 72, 45000000),
            ("Túi da • mẫu C", 115, 30000000),
            ("Phụ kiện • mẫu D", 182, 12000000),
        ],
        1,
    )
]
WARNINGS: list[dict[str, Any]] = [
    dict(
        id="DEMO-E01",
        issue="Thiếu mã đối chiếu thu tiền",
        record="DEMO-S002",
        severity="Cần kiểm tra",
        source="demo:accounting",
    ),
    dict(
        id="DEMO-E02",
        issue="Tồn trên 180 ngày",
        record="DEMO-I4",
        severity="Ưu tiên",
        source="demo:price-system",
    ),
]


def transactions(period: str):
    return [r for r in TRANSACTIONS if r["business_at"].startswith(period)] if period else []


def summary(period: str):
    rows = transactions(period)
    revenue = sum(r["amount"] for r in rows)
    cogs = sum(r["cost"] for r in rows)
    costs = COSTS if period == "2026-10" else []
    operating = sum(c["amount"] for c in costs)
    groups = {}
    for dimension in ("channel", "sale"):
        amounts: dict[str, int] = defaultdict(int)
        for row in rows:
            amounts[row[dimension]] += row["amount"]
        groups[dimension] = [
            dict(label=k, amount=v, percent=round(v / revenue * 100, 4) if revenue else 0)
            for k, v in amounts.items()
        ]
    return dict(
        revenue=revenue,
        cogs=cogs,
        operating=operating,
        total_cost=cogs + operating,
        result=revenue - cogs - operating,
        groups=groups,
        categories=[dict(category="Giá vốn", amount=cogs), *costs] if rows else [],
        inventory_value=sum(r["value"] for r in INVENTORY) if period else 0,
        warning_count=len(WARNINGS) if period else 0,
        aging_count=sum(1 for r in INVENTORY if r["age_days"] >= 90) if period else 0,
        aging_value=sum(r["value"] for r in INVENTORY if r["age_days"] >= 90) if period else 0,
    )


for warning in WARNINGS:
    warning.update(
        money_impact=30000000 if warning["id"] == "DEMO-E01" else 12000000,
        repair_steps="Đối chiếu ID nguồn và chứng từ; chuyển người có thẩm quyền kiểm tra. Không khớp bằng tiền/tên.",
        completion="Có chứng từ đúng khóa và xác nhận được duyệt; demo không tự đánh dấu hoàn tất.",
    )

for cost in COSTS:
    cost.update(
        source="demo:accounting",
        original_id=cost["id"],
        business_at="2026-10-10T10:00:00+07:00",
        synced_at=AS_OF,
    )
for warning in WARNINGS:
    warning.update(original_id=warning["id"], business_at=AS_OF, synced_at=AS_OF)
