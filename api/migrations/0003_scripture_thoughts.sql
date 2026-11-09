CREATE TABLE scripture_thoughts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  submission_id TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL CHECK (length(trim(display_name)) BETWEEN 1 AND 32),
  passage TEXT NOT NULL CHECK (length(trim(passage)) BETWEEN 1 AND 80),
  thought TEXT NOT NULL CHECK (length(trim(thought)) BETWEEN 1 AND 1000),
  created_at TEXT NOT NULL
);
