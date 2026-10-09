CREATE TABLE IF NOT EXISTS readers (
  name TEXT PRIMARY KEY,
  page INTEGER NOT NULL CHECK (page BETWEEN 0 AND 531),
  revision INTEGER NOT NULL DEFAULT 0 CHECK (revision >= 0),
  updated_at TEXT NOT NULL
);

INSERT OR IGNORE INTO readers (name, page, revision, updated_at) VALUES
('Caleb', 30, 0, '2026-10-09T03:11:40.301782Z'),
('Katelyn', 7, 0, '2026-10-09T03:11:40.301782Z'),
('Elizabeth', 16, 0, '2026-10-09T03:11:40.301782Z'),
('Benjamin', 21, 0, '2026-10-09T03:11:40.301782Z'),
('Aaron', 5, 0, '2026-10-09T03:11:40.301782Z'),
('Lydia', 20, 0, '2026-10-09T03:11:40.301782Z'),
('Mom', 0, 0, '2026-10-09T03:11:40.301782Z');
