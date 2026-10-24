export const MIGRATIONS_SQL = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'STAFF',
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS venues (
  id TEXT PRIMARY KEY,
  organizer_id TEXT NOT NULL,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  country TEXT NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  accessibility_notes TEXT
);

CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  organizer_id TEXT NOT NULL,
  venue_id TEXT REFERENCES venues(id),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  short_description TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'CULTURE',
  status TEXT NOT NULL DEFAULT 'DRAFT',
  timezone TEXT NOT NULL DEFAULT 'UTC',
  hero_image TEXT NOT NULL,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  doors_open_time TEXT,
  cancellation_policy TEXT NOT NULL DEFAULT 'Full refund up to 48 hours prior to event opening.',
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS event_occurrences (
  id TEXT PRIMARY KEY,
  event_id TEXT REFERENCES events(id) ON DELETE CASCADE,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  venue_override_id TEXT REFERENCES venues(id),
  status TEXT NOT NULL DEFAULT 'SCHEDULED'
);

CREATE TABLE IF NOT EXISTS ticket_types (
  id TEXT PRIMARY KEY,
  event_id TEXT REFERENCES events(id) ON DELETE CASCADE,
  occurrence_id TEXT REFERENCES event_occurrences(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  price_in_cents INTEGER NOT NULL CHECK (price_in_cents >= 0),
  sales_start TIMESTAMPTZ NOT NULL,
  sales_end TIMESTAMPTZ NOT NULL,
  visibility TEXT NOT NULL DEFAULT 'PUBLIC',
  max_per_order INTEGER NOT NULL DEFAULT 4,
  status TEXT NOT NULL DEFAULT 'ACTIVE'
);

CREATE TABLE IF NOT EXISTS ticket_inventory (
  id TEXT PRIMARY KEY,
  occurrence_id TEXT REFERENCES event_occurrences(id) ON DELETE CASCADE,
  ticket_type_id TEXT REFERENCES ticket_types(id) ON DELETE CASCADE,
  capacity INTEGER NOT NULL CHECK (capacity >= 0),
  held INTEGER NOT NULL DEFAULT 0 CHECK (held >= 0),
  sold INTEGER NOT NULL DEFAULT 0 CHECK (sold >= 0),
  version INTEGER NOT NULL DEFAULT 1,
  CONSTRAINT chk_capacity CHECK (held + sold <= capacity),
  CONSTRAINT uq_occurrence_ticket_type UNIQUE (occurrence_id, ticket_type_id)
);

CREATE TABLE IF NOT EXISTS reservations (
  id TEXT PRIMARY KEY,
  public_token TEXT UNIQUE NOT NULL,
  event_id TEXT REFERENCES events(id),
  buyer_name TEXT NOT NULL,
  buyer_email TEXT NOT NULL,
  buyer_notes TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING_HOLD',
  hold_expires_at TIMESTAMPTZ NOT NULL,
  total_amount_in_cents INTEGER NOT NULL DEFAULT 0 CHECK (total_amount_in_cents >= 0),
  currency TEXT NOT NULL DEFAULT 'USD',
  idempotency_key TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  confirmed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS reservation_lines (
  id TEXT PRIMARY KEY,
  reservation_id TEXT REFERENCES reservations(id) ON DELETE CASCADE,
  ticket_type_id TEXT REFERENCES ticket_types(id),
  occurrence_id TEXT REFERENCES event_occurrences(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price_per_unit_in_cents INTEGER NOT NULL CHECK (price_per_unit_in_cents >= 0)
);

CREATE TABLE IF NOT EXISTS issued_tickets (
  id TEXT PRIMARY KEY,
  public_id TEXT UNIQUE NOT NULL,
  reservation_id TEXT REFERENCES reservations(id) ON DELETE CASCADE,
  reservation_line_id TEXT REFERENCES reservation_lines(id) ON DELETE CASCADE,
  ticket_type_id TEXT REFERENCES ticket_types(id),
  occurrence_id TEXT REFERENCES event_occurrences(id),
  attendee_name TEXT NOT NULL,
  attendee_email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'VALID',
  qr_payload TEXT NOT NULL,
  signature TEXT NOT NULL,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  revoked_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS check_ins (
  id TEXT PRIMARY KEY,
  ticket_id TEXT UNIQUE NOT NULL REFERENCES issued_tickets(id),
  scanned_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  scanned_by_staff_id TEXT NOT NULL,
  scanned_by_staff_name TEXT NOT NULL,
  gate_or_device TEXT NOT NULL DEFAULT 'Main Gate',
  notes TEXT
);

CREATE TABLE IF NOT EXISTS audit_events (
  id TEXT PRIMARY KEY,
  organizer_id TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  actor_email TEXT NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  metadata_json TEXT NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS idempotency_records (
  id TEXT PRIMARY KEY,
  scoped_key TEXT UNIQUE NOT NULL,
  request_hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PROCESSING',
  response_json TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_events_slug ON events(slug);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_reservations_token ON reservations(public_token);
CREATE INDEX IF NOT EXISTS idx_reservations_status_expires ON reservations(status, hold_expires_at);
CREATE INDEX IF NOT EXISTS idx_issued_tickets_public_id ON issued_tickets(public_id);
CREATE INDEX IF NOT EXISTS idx_check_ins_ticket ON check_ins(ticket_id);
`;
