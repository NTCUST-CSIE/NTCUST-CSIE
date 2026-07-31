DROP TABLE IF EXISTS search_logs;

CREATE TABLE search_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    url TEXT NOT NULL,
    department TEXT,
    contact_phone TEXT,
    title TEXT,
    content TEXT,
    published_date TEXT,
    publisher TEXT,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS phone_directory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    campus TEXT,
    department TEXT,
    role_or_name TEXT,
    extension TEXT
);
