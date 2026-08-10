import { io as ioClient, Socket } from 'socket.io-client';
import { API_BASE_URL } from './api';

/**
 * Creates a safe, resilient Socket.io connection that gracefully handles
 * serverless environments (like Vercel) where WebSocket long-polling can fail.
 */
export function createSafeSocket(token?: string | null): Socket | null {
  try {
    const wsUrl = (import.meta as any).env?.VITE_WS_URL || API_BASE_URL;
    
    // If we are on a static/serverless origin without explicit WS URL,
    // socket.io polling will trigger 404 NOT_FOUND errors.
    const isServerlessOrigin = typeof window !== 'undefined' && 
      (!wsUrl || wsUrl === '' || wsUrl === window.location.origin);

    const socket = ioClient(wsUrl || undefined, {
      auth: { token: token || localStorage.getItem('accessToken') },
      autoConnect: false,
      reconnectionAttempts: 2,
      reconnectionDelay: 5000,
      timeout: 3000,
      transports: ['websocket', 'polling'],
    });

    socket.on('connect_error', (err) => {
      // Silently handle connection error and stop retrying to prevent network noise
      socket.disconnect();
    });

    // Only attempt connecting if not on serverless origin without WS or if explicit WS URL is configured
    if (!isServerlessOrigin || (import.meta as any).env?.VITE_WS_URL) {
      socket.connect();
    }

    return socket;
  } catch (err) {
    return null;
  }
}
