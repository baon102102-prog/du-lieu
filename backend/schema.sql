-- PostgreSQL target schema. Review only; never auto-applied by the demo runner.
CREATE TABLE source_record (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 source text NOT NULL, original_id text NOT NULL,
 business_at timestamptz NOT NULL, synced_at timestamptz NOT NULL,
 payload jsonb NOT NULL, payload_hash text NOT NULL,
 UNIQUE(source, original_id)
);
CREATE TABLE bank_transaction (
 bank text NOT NULL, account text NOT NULL, original_transaction_id text NOT NULL,
 source_record_id bigint REFERENCES source_record(id),
 PRIMARY KEY(bank, account, original_transaction_id)
);
CREATE TABLE snapshot (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 period date NOT NULL, captured_at timestamptz NOT NULL, source_hashes jsonb NOT NULL,
 payload jsonb NOT NULL
);
CREATE TABLE approved_correction (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 record_id bigint NOT NULL REFERENCES source_record(id),
 reason text NOT NULL, approved_by text NOT NULL, approved_at timestamptz NOT NULL,
 before_payload jsonb NOT NULL, after_payload jsonb NOT NULL
);
CREATE TABLE section_grant (
 principal_id text NOT NULL, section text NOT NULL, granted_by text NOT NULL,
 PRIMARY KEY(principal_id, section)
);
-- Closed snapshots are append-only by application policy. Future live import must
-- quarantine changed closed source records and block close until an approved correction.
