import { createServer } from 'http';
import { Server } from 'socket.io';
import next from 'next';
import pool from './lib/db';

declare global {
  var io: Server | undefined;
}

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '4000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    handle(req, res);
  });

  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      credentials: true,
    },
  });

  globalThis.io = io;

  io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);

    socket.on('join_room', (mosqueUuid) => {
      socket.join(mosqueUuid);
      console.log(`Socket joined room: ${mosqueUuid}`);

      const deviceUuid = socket.handshake.auth?.device_uuid || socket.handshake.query?.device_uuid;
      if (deviceUuid) {
        socket.data.device_uuid = deviceUuid;
        socket.data.mosque_uuid = mosqueUuid;
        pool.execute('UPDATE devices SET is_online = 1, last_seen_at = NOW() WHERE id = ?', [deviceUuid]).catch(() => {});
      }
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
      const deviceUuid = socket.data?.device_uuid;
      if (deviceUuid) {
        pool.execute('UPDATE devices SET is_online = 0, last_seen_at = NOW() WHERE id = ?', [deviceUuid]).catch(() => {});
      }
    });
  });

  httpServer.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
