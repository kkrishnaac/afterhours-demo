-- Walkthrough requests from the website form. Holds only what the form asks
-- for (no IP addresses, no browser details). Rows are deleted after
-- RETENTION_DAYS by the scheduled job.
CREATE TABLE walkthrough_requests (
  id                    TEXT PRIMARY KEY,               -- random UUID, also the reference in emails
  created_at            TEXT NOT NULL,                  -- ISO 8601, UTC
  office_size           TEXT NOT NULL,
  timing                TEXT NOT NULL,
  city                  TEXT NOT NULL,
  name                  TEXT NOT NULL,
  email                 TEXT NOT NULL,
  phone                 TEXT,
  marketing_consent     INTEGER NOT NULL DEFAULT 0,     -- CASL: 1 only if the unticked box was ticked
  marketing_consent_at  TEXT,                           -- when that consent was given
  consent_version       TEXT NOT NULL,                  -- which wording was shown next to the form
  source                TEXT NOT NULL,                  -- where the consent came from
  notify_status         TEXT NOT NULL DEFAULT 'pending',-- email to HARA: pending | sent | failed
  notify_attempts       INTEGER NOT NULL DEFAULT 0,
  confirm_status        TEXT NOT NULL DEFAULT 'pending',-- email to requester: pending | sent | failed | skipped
  status                TEXT NOT NULL DEFAULT 'new'     -- for a future dashboard: new, contacted, booked, quoted, won, lost
);

CREATE INDEX idx_walkthrough_created ON walkthrough_requests (created_at);
CREATE INDEX idx_walkthrough_email ON walkthrough_requests (email COLLATE NOCASE, created_at);
CREATE INDEX idx_walkthrough_notify ON walkthrough_requests (notify_status, created_at);
