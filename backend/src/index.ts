import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { connectDB } from './config/db';
import { redisClient } from './config/redis';
import { env } from './config/env';
import { initWebSocket } from './services/websocketService';
import { startWorker } from './workers/generationWorker';
import authRoutes from './routes/auth';
import assignmentRoutes from './routes/assignments';
import resultRoutes from './routes/results';
import { errorHandler } from './middleware/errorHandler';

// ── App Setup ─────────────────────────────────────────────────────────────────

const app = express();

// Security
app.use(helmet());

// CORS
app.use(
  cors({
    origin: true, // Automatically reflects the request origin (fixes Vercel multiple domain issues)
    credentials: true,
  })
);

// Logging
app.use(morgan('dev'));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ── Routes ────────────────────────────────────────────────────────────────────

app.use('/api/auth', authRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/results', resultRoutes);

// Base route for uptime monitors
app.get('/', (_req, res) => {
  res.status(200).send('Flux Backend is running smoothly.');
});

// Health check
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler for unmatched routes
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found.' });
});

// Global error handler (must be last)
app.use(errorHandler);

// ── HTTP + WebSocket Server ───────────────────────────────────────────────────

const server = http.createServer(app);

// Initialize WebSocket server
initWebSocket(server);

// ── Bootstrap ─────────────────────────────────────────────────────────────────

async function bootstrap() {
  try {
    // Connect to MongoDB
    await connectDB();

    // Start the BullMQ worker
    startWorker();

    // Start listening
    server.listen(env.PORT, () => {
      console.log(`🚀 Flux backend running on port ${env.PORT} [${env.NODE_ENV}]`);
      console.log(`   WebSocket available on ws://localhost:${env.PORT}`);
    });
  } catch (error) {
    console.error('❌ Bootstrap failed:', error);
    process.exit(1);
  }
}

// ── Graceful Shutdown ─────────────────────────────────────────────────────────

process.on('SIGTERM', async () => {
  console.log('🛑 SIGTERM received. Shutting down gracefully...');

  server.close(async () => {
    console.log('   HTTP server closed.');

    try {
      await redisClient.quit();
      console.log('   Redis disconnected.');
    } catch (err) {
      console.error('   Redis disconnect error:', err);
    }

    process.exit(0);
  });

  // Force exit after 10 seconds if graceful shutdown takes too long
  setTimeout(() => {
    console.error('   Forced exit after timeout.');
    process.exit(1);
  }, 10_000);
});

process.on('SIGINT', async () => {
  console.log('\n🛑 SIGINT received. Shutting down...');
  process.emit('SIGTERM');
});

bootstrap();
