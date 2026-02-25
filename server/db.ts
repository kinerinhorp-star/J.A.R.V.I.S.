import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';

const db = new Database('jarvis.db');

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    role TEXT DEFAULT 'user'
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    title TEXT,
    description TEXT,
    status TEXT DEFAULT 'pending',
    due_date TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS memory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    key TEXT,
    value TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    action TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
`);

// Create default admin if not exists
const jarvisExists = db.prepare('SELECT * FROM users WHERE username = ?').get('jarvis');
if (!jarvisExists) {
  const hash = bcrypt.hashSync('jarvis', 10);
  db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)').run('jarvis', hash, 'admin');
}

export { db };
