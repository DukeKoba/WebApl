import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '..', 'data.db');

const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  -- Organizations/Teams
  CREATE TABLE IF NOT EXISTS organizations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT DEFAULT 'general',
    timezone TEXT DEFAULT 'Asia/Tokyo',
    settings TEXT DEFAULT '{}',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Members (staff/workers)
  CREATE TABLE IF NOT EXISTS members (
    id TEXT PRIMARY KEY,
    org_id TEXT NOT NULL,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    role TEXT DEFAULT 'staff',
    hourly_rate REAL DEFAULT 0,
    max_hours_per_week REAL DEFAULT 40,
    skills TEXT DEFAULT '[]',
    color TEXT DEFAULT '#3B82F6',
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE
  );

  -- Availability patterns (recurring)
  CREATE TABLE IF NOT EXISTS availability (
    id TEXT PRIMARY KEY,
    member_id TEXT NOT NULL,
    day_of_week INTEGER NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    is_available INTEGER DEFAULT 1,
    effective_from DATE,
    effective_until DATE,
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
  );

  -- Shift templates
  CREATE TABLE IF NOT EXISTS shift_templates (
    id TEXT PRIMARY KEY,
    org_id TEXT NOT NULL,
    name TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    required_count INTEGER DEFAULT 1,
    required_skills TEXT DEFAULT '[]',
    color TEXT DEFAULT '#3B82F6',
    break_minutes INTEGER DEFAULT 0,
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE
  );

  -- Schedules (a week/month of shifts)
  CREATE TABLE IF NOT EXISTS schedules (
    id TEXT PRIMARY KEY,
    org_id TEXT NOT NULL,
    name TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status TEXT DEFAULT 'draft',
    published_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE
  );

  -- Actual shift assignments
  CREATE TABLE IF NOT EXISTS shifts (
    id TEXT PRIMARY KEY,
    schedule_id TEXT NOT NULL,
    template_id TEXT,
    member_id TEXT,
    date DATE NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    break_minutes INTEGER DEFAULT 0,
    status TEXT DEFAULT 'assigned',
    notes TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (schedule_id) REFERENCES schedules(id) ON DELETE CASCADE,
    FOREIGN KEY (template_id) REFERENCES shift_templates(id) ON DELETE SET NULL,
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE SET NULL
  );

  -- Absence/time-off requests
  CREATE TABLE IF NOT EXISTS absences (
    id TEXT PRIMARY KEY,
    member_id TEXT NOT NULL,
    schedule_id TEXT,
    date DATE NOT NULL,
    reason TEXT DEFAULT '',
    status TEXT DEFAULT 'pending',
    replacement_member_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
    FOREIGN KEY (schedule_id) REFERENCES schedules(id) ON DELETE SET NULL,
    FOREIGN KEY (replacement_member_id) REFERENCES members(id) ON DELETE SET NULL
  );

  -- Shift swap requests
  CREATE TABLE IF NOT EXISTS swap_requests (
    id TEXT PRIMARY KEY,
    shift_id TEXT NOT NULL,
    requester_id TEXT NOT NULL,
    target_id TEXT,
    status TEXT DEFAULT 'open',
    message TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (shift_id) REFERENCES shifts(id) ON DELETE CASCADE,
    FOREIGN KEY (requester_id) REFERENCES members(id) ON DELETE CASCADE,
    FOREIGN KEY (target_id) REFERENCES members(id) ON DELETE SET NULL
  );

  -- Activity log
  CREATE TABLE IF NOT EXISTS activity_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    org_id TEXT NOT NULL,
    action TEXT NOT NULL,
    details TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE
  );
`);

export default db;
