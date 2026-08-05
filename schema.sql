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

-- ==========================================
-- 3. Unified Website Traffic & Shortlink Analytics Table
-- ==========================================
CREATE TABLE IF NOT EXISTS traffic_stats (
    path TEXT PRIMARY KEY,       -- e.g. '/', '/members', '/115_ns', '/line'
    type TEXT NOT NULL,          -- 'page' or 'shortlink'
    target TEXT DEFAULT '',      -- target URL if shortlink
    hits INTEGER DEFAULT 0,      -- views or clicks count
    last_accessed_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 4. Unique Visitor & Time-Gap Returning Visitor Tracking Table
-- ==========================================
CREATE TABLE IF NOT EXISTS visitors (
    visitor_id TEXT PRIMARY KEY,
    first_seen_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_seen_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_visit_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    visit_count INTEGER DEFAULT 1,
    page_views INTEGER DEFAULT 1,
    returns_after_30m INTEGER DEFAULT 0,
    returns_after_24h INTEGER DEFAULT 0,
    returns_after_7d INTEGER DEFAULT 0
);
