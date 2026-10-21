"""PostgreSQL storage seam; never connects or creates credentials on import.

Explicitly not used by synthetic demo. Schema changes and live configuration need
separate review. All imports here retain the original source payload.
"""

from datetime import datetime
from typing import Any

from sqlalchemy import BigInteger, Column, DateTime, MetaData, Table, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB, insert
from sqlalchemy.engine import Connection

metadata = MetaData()
source_record = Table(
    "source_record",
    metadata,
    Column("id", BigInteger, primary_key=True),
    Column("source", Text, nullable=False),
    Column("original_id", Text, nullable=False),
    Column("business_at", DateTime(timezone=True), nullable=False),
    Column("synced_at", DateTime(timezone=True), nullable=False),
    Column("payload", JSONB, nullable=False),
    Column("payload_hash", Text, nullable=False),
    UniqueConstraint("source", "original_id"),
)


def insert_new_statement(
    source: str,
    original_id: str,
    business_at: datetime,
    synced_at: datetime,
    payload: dict[str, Any],
    payload_hash: str,
):
    # Existing payload never overwritten. Caller must compare hashes and quarantine
    # changed closed history. Approved corrections are separate append-only records.
    return (
        insert(source_record)
        .values(
            source=source,
            original_id=original_id,
            business_at=business_at,
            synced_at=synced_at,
            payload=payload,
            payload_hash=payload_hash,
        )
        .on_conflict_do_nothing(index_elements=["source", "original_id"])
    )


class PostgresSourceStore:
    def __init__(self, connection: Connection):
        if connection.dialect.name != "postgresql":
            raise ValueError("PostgreSQL connection required")
        self.connection = connection

    def insert_new(self, **record):
        return self.connection.execute(insert_new_statement(**record))
