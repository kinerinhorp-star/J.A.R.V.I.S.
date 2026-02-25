import { Router } from 'express';
import { db } from '../db.js';

const router = Router();

// Middleware to verify token (simplified for MVP)
const auth = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Não autorizado' });
  // Mocking user ID for MVP
  req.userId = 1; 
  next();
};

router.get('/', auth, (req: any, res) => {
  const tasks = db.prepare('SELECT * FROM tasks WHERE user_id = ? ORDER BY id DESC').all(req.userId);
  res.json(tasks);
});

router.post('/', auth, (req: any, res) => {
  const { title, description, due_date } = req.body;
  const result = db.prepare('INSERT INTO tasks (user_id, title, description, due_date) VALUES (?, ?, ?, ?)').run(req.userId, title, description, due_date);
  res.json({ id: result.lastInsertRowid });
});

router.put('/:id', auth, (req: any, res) => {
  const { status } = req.body;
  db.prepare('UPDATE tasks SET status = ? WHERE id = ? AND user_id = ?').run(status, req.params.id, req.userId);
  res.json({ success: true });
});

router.delete('/:id', auth, (req: any, res) => {
  db.prepare('DELETE FROM tasks WHERE id = ? AND user_id = ?').run(req.params.id, req.userId);
  res.json({ success: true });
});

export default router;
