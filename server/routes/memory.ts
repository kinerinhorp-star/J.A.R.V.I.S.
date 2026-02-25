import { Router } from 'express';
import { db } from '../db.js';

const router = Router();

router.get('/', (req: any, res) => {
  try {
    const userId = 1; // Mocked auth
    const memories = db.prepare('SELECT * FROM memory WHERE user_id = ?').all(userId);
    res.json(memories);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao obter memória.' });
  }
});

router.post('/', (req: any, res) => {
  try {
    const userId = 1; // Mocked auth
    const { key, value } = req.body;
    
    // Check if key exists
    const existing = db.prepare('SELECT id FROM memory WHERE user_id = ? AND key = ?').get(userId, key);
    
    if (existing) {
      db.prepare('UPDATE memory SET value = ? WHERE id = ?').run(value, (existing as any).id);
    } else {
      db.prepare('INSERT INTO memory (user_id, key, value) VALUES (?, ?, ?)').run(userId, key, value);
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao guardar memória.' });
  }
});

export default router;
