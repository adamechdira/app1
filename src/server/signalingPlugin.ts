/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Plugin } from 'vite';

interface SignalMessage {
  id: string;
  roomId: string;
  fromPeerId: string;
  toPeerId?: string;
  data: any;
  timestamp: number;
}

interface PeerInfo {
  peerId: string;
  roomId: string;
  name: string;
  deviceType: 'pc' | 'phone';
  lastSeen: number;
}

// In-memory rooms and signaling message queues
const rooms = new Map<string, Map<string, PeerInfo>>();
const messageQueues = new Map<string, SignalMessage[]>();

export function signalingPlugin(): Plugin {
  return {
    name: 'tawasol-p2p-signaling',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url || '';

        if (!url.startsWith('/api/signal')) {
          return next();
        }

        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
          res.statusCode = 204;
          return res.end();
        }

        // Helper to read JSON body
        const readBody = (): Promise<any> => {
          return new Promise((resolve) => {
            let data = '';
            req.on('data', (chunk) => (data += chunk));
            req.on('end', () => {
              try {
                resolve(data ? JSON.parse(data) : {});
              } catch {
                resolve({});
              }
            });
          });
        };

        const parsedUrl = new URL(url, 'http://localhost:3000');
        const pathname = parsedUrl.pathname;

        // POST /api/signal/join -> register peer in room
        if (pathname === '/api/signal/join' && req.method === 'POST') {
          const body = await readBody();
          const { roomId, peerId, name, deviceType } = body;

          if (!roomId || !peerId) {
            res.statusCode = 400;
            return res.end(JSON.stringify({ error: 'Missing roomId or peerId' }));
          }

          if (!rooms.has(roomId)) {
            rooms.set(roomId, new Map());
          }

          const room = rooms.get(roomId)!;
          room.set(peerId, {
            peerId,
            roomId,
            name: name || 'Peer',
            deviceType: deviceType || 'pc',
            lastSeen: Date.now(),
          });

          // Cleanup peers inactive for > 60s
          const now = Date.now();
          for (const [id, peer] of room.entries()) {
            if (now - peer.lastSeen > 60000 && id !== peerId) {
              room.delete(id);
            }
          }

          res.setHeader('Content-Type', 'application/json');
          return res.end(
            JSON.stringify({
              success: true,
              peers: Array.from(room.values()),
            })
          );
        }

        // POST /api/signal/send -> send signaling offer, answer, or candidate
        if (pathname === '/api/signal/send' && req.method === 'POST') {
          const body = await readBody();
          const { roomId, fromPeerId, toPeerId, data } = body;

          if (!roomId || !fromPeerId || !data) {
            res.statusCode = 400;
            return res.end(JSON.stringify({ error: 'Missing required signaling fields' }));
          }

          const msg: SignalMessage = {
            id: Math.random().toString(36).substring(2, 9),
            roomId,
            fromPeerId,
            toPeerId,
            data,
            timestamp: Date.now(),
          };

          if (!messageQueues.has(roomId)) {
            messageQueues.set(roomId, []);
          }
          const queue = messageQueues.get(roomId)!;
          queue.push(msg);

          // Keep queue bounded
          if (queue.length > 50) {
            queue.splice(0, queue.length - 50);
          }

          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ success: true, messageId: msg.id }));
        }

        // GET /api/signal/poll?roomId=...&peerId=...&since=... -> poll for new signaling packets
        if (pathname === '/api/signal/poll' && req.method === 'GET') {
          const roomId = parsedUrl.searchParams.get('roomId');
          const peerId = parsedUrl.searchParams.get('peerId');
          const since = parseInt(parsedUrl.searchParams.get('since') || '0', 10);

          if (!roomId || !peerId) {
            res.statusCode = 400;
            return res.end(JSON.stringify({ error: 'Missing roomId or peerId' }));
          }

          // Update heartbeat
          if (rooms.has(roomId)) {
            const peer = rooms.get(roomId)!.get(peerId);
            if (peer) {
              peer.lastSeen = Date.now();
            }
          }

          const queue = messageQueues.get(roomId) || [];
          // Filter messages meant for this peer or broadcast, and newer than 'since'
          const newMessages = queue.filter(
            (m) =>
              m.timestamp > since &&
              m.fromPeerId !== peerId &&
              (!m.toPeerId || m.toPeerId === peerId)
          );

          const roomPeers = rooms.has(roomId) ? Array.from(rooms.get(roomId)!.values()) : [];

          res.setHeader('Content-Type', 'application/json');
          return res.end(
            JSON.stringify({
              messages: newMessages,
              peers: roomPeers,
              timestamp: Date.now(),
            })
          );
        }

        // GET /api/signal/leave
        if (pathname === '/api/signal/leave' && req.method === 'POST') {
          const body = await readBody();
          const { roomId, peerId } = body;
          if (roomId && peerId && rooms.has(roomId)) {
            rooms.get(roomId)!.delete(peerId);
          }
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ success: true }));
        }

        return next();
      });
    },
  };
}
