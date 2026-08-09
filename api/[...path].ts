import type { VercelRequest, VercelResponse } from '@vercel/node';
import { app } from '../server/src/app.js';

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.url?.startsWith('/api/')) {
    req.url = req.url.slice(4) || '/';
  }

  return app(req as any, res as any);
}
