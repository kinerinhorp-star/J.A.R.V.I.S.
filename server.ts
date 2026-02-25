import express from 'express';
import { createServer as createViteServer } from 'vite';
import { db } from './server/db.js';
import authRoutes from './server/routes/auth.js';
import taskRoutes from './server/routes/tasks.js';
import chatRoutes from './server/routes/chat.js';
import statsRoutes from './server/routes/stats.js';
import memoryRoutes from './server/routes/memory.js';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/tasks', taskRoutes);
  app.use('/api/chat', chatRoutes);
  app.use('/api/stats', statsRoutes);
  app.use('/api/memory', memoryRoutes);

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`JARVIS PT Server running on http://localhost:${PORT}`);
  });
}

startServer();
