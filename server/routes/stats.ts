import { Router } from 'express';
import { db } from '../db.js';

const router = Router();

router.get('/', (req, res) => {
  const totalTasks = db.prepare('SELECT COUNT(*) as count FROM tasks').get() as any;
  const totalLogs = db.prepare('SELECT COUNT(*) as count FROM logs').get() as any;
  const activeUsers = db.prepare('SELECT COUNT(*) as count FROM users').get() as any;
  
  res.json({
    tasks: totalTasks.count,
    interactions: totalLogs.count,
    users: activeUsers.count,
    systemHealth: '100%',
    uptime: process.uptime()
  });
});

export default router;
