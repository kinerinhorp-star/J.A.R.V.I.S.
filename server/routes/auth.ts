import { Router } from 'express';
import { db } from '../db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = Router();
const SECRET = process.env.JWT_SECRET || 'jarvis-secret-key-2026';

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as any;

  if (user && bcrypt.compareSync(password, user.password)) {
    const token = jwt.sign({ id: user.id, role: user.role }, SECRET, { expiresIn: '24h' });
    
    // Log activity
    db.prepare('INSERT INTO logs (user_id, action) VALUES (?, ?)').run(user.id, 'User logged in');
    
    res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
  } else {
    res.status(401).json({ error: 'Credenciais inválidas' });
  }
});

export default router;
