-- This schema is also created automatically by server.py.
-- Use this file if you inspect the database with a SQLite tool.

CREATE TABLE IF NOT EXISTS applications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL CHECK (length(trim(name)) BETWEEN 2 AND 120),
  email TEXT NOT NULL CHECK (length(trim(email)) <= 254),
  phone TEXT NOT NULL CHECK (length(trim(phone)) BETWEEN 7 AND 40),
  course TEXT NOT NULL CHECK (length(trim(course)) BETWEEN 2 AND 160),
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'enrolled', 'rejected')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
