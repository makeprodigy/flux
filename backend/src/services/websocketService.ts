import WebSocket, { WebSocketServer } from 'ws';
import http from 'http';

import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export const wsClients: Map<string, Set<WebSocket>> = new Map();

export function initWebSocket(server: http.Server): WebSocketServer {
  const wss = new WebSocketServer({ server });

  wss.on('connection', (ws: WebSocket, request: http.IncomingMessage) => {
    let isAuthenticated = false;
    try {
      let token = '';
      
      if (request.url) {
        const urlParams = new URLSearchParams(request.url.split('?')[1] || '');
        token = urlParams.get('token') || '';
      }
      
      if (!token) {
        const cookieStr = request.headers.cookie || '';
        token = cookieStr.split('; ').find(c => c.startsWith('flux_token='))?.split('=')[1] || '';
      }

      if (token) {
        jwt.verify(token, env.JWT_SECRET);
        isAuthenticated = true;
      }
    } catch {}

    if (!isAuthenticated) {
      ws.close(1008, 'Unauthorized');
      return;
    }

    let subscribedJobId: string | null = null;

    ws.on('message', (raw: WebSocket.RawData) => {
      try {
        const message = JSON.parse(raw.toString());

        if (message.type === 'subscribe' && typeof message.jobId === 'string') {
          // Unsubscribe from previous job if any
          const prevJobId = subscribedJobId;
          if (prevJobId !== null) {
            const prevSet = wsClients.get(prevJobId);
            if (prevSet) {
              prevSet.delete(ws);
              if (prevSet.size === 0) wsClients.delete(prevJobId);
            }
          }

          const newJobId: string = message.jobId;
          subscribedJobId = newJobId;

          if (!wsClients.has(newJobId)) {
            wsClients.set(newJobId, new Set());
          }
          wsClients.get(newJobId)!.add(ws);

          // Acknowledge subscription
          ws.send(JSON.stringify({ type: 'subscribed', jobId: newJobId }));
        }
      } catch {
        // Ignore malformed messages
      }
    });

    const cleanup = () => {
      if (subscribedJobId) {
        const set = wsClients.get(subscribedJobId);
        if (set) {
          set.delete(ws);
          if (set.size === 0) wsClients.delete(subscribedJobId);
        }
      }
    };

    ws.on('close', cleanup);
    ws.on('error', (err) => {
      console.error('[WebSocket] Client error:', err.message);
      cleanup();
    });
  });

  wss.on('error', (err) => console.error('[WebSocket] Server error:', err));

  console.log('✅ WebSocket server initialized');
  return wss;
}

export function broadcastJobUpdate(jobId: string, payload: object): void {
  const clients = wsClients.get(jobId);
  if (!clients || clients.size === 0) return;

  const message = JSON.stringify(payload);

  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(message);
      } catch (err) {
        console.error(`[WebSocket] Failed to send to client for job ${jobId}:`, err);
      }
    }
  }
}

export function broadcastJobComplete(jobId: string, resultId: string): void {
  broadcastJobUpdate(jobId, { type: 'job:complete', jobId, resultId });
}

export function broadcastJobProgress(jobId: string, progress: number, message: string): void {
  broadcastJobUpdate(jobId, { type: 'job:progress', jobId, progress, message });
}

export function broadcastJobFailed(jobId: string, error: string): void {
  broadcastJobUpdate(jobId, { type: 'job:failed', jobId, error });
}
