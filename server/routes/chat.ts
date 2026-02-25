import { Router } from 'express';
import { db } from '../db.js';

const router = Router();

router.post('/log', (req: any, res) => {
  try {
    const userId = 1; // Mocked auth
    db.prepare('INSERT INTO logs (user_id, action) VALUES (?, ?)').run(userId, 'Chat interaction');
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao registar log.' });
  }
});

export default router;
