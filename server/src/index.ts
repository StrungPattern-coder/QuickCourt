import { createServer } from 'http';
// import { Server } from 'socket.io';
import { app } from './app.js';
import { env } from './config/env.js';

const httpServer = createServer(app);
// export const io = new Server(httpServer, { cors: { origin: env.corsOrigin } });

// io.on('connection', (socket) => {
//   console.log('Socket connected', socket.id);
//   socket.on('disconnect', () => console.log('Socket disconnected', socket.id));
// });

httpServer.listen(env.port, () => {
  console.log(`API listening on http://localhost:${env.port}`);
});
