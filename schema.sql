CREATE TABLE IF NOT EXISTS requests (
  id TEXT PRIMARY KEY,
  action TEXT NOT NULL,
  comment TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_requests_created_at ON requests(created_at);
