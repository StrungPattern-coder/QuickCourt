import type { VercelRequest, VercelResponse } from '@vercel/node';
import { app } from '../server/src/app.js';

export default function handler(req: VercelRequest, res: VercelResponse) {
  const pathParam = req.query.path;
  const path = Array.isArray(pathParam) ? pathParam.join('/') : pathParam;

  if (path) {
    const searchParams = new URLSearchParams();
    Object.entries(req.query).forEach(([key, value]) => {
      if (key === 'path') return;
      if (Array.isArray(value)) {
        value.forEach((item) => searchParams.append(key, item));
      } else if (value !== undefined) {
        searchParams.set(key, value);
      }
    });

    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    const queryString = searchParams.toString();
    req.url = queryString ? `${normalizedPath}?${queryString}` : normalizedPath;
  } else if (req.url?.startsWith('/api')) {
    req.url = req.url.slice(4) || '/';
  }

  return app(req as any, res as any);
}
