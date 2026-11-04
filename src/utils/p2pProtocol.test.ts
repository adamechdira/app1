/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createP2PPacket,
  parseP2PPacket,
  calculateFileChunks,
  formatBytes,
  formatDuration,
  analyzeIceCandidate,
  generateRoomCode,
} from './p2pProtocol';

test('creates valid P2P packet with correct envelope', () => {
  const packet = createP2PPacket('chat', 'peer-1', { text: 'Salam' });
  assert.equal(packet.version, 1);
  assert.equal(packet.type, 'chat');
  assert.equal(packet.senderId, 'peer-1');
  assert.deepEqual(packet.payload, { text: 'Salam' });
  assert.ok(packet.timestamp > 0);
});

test('parses valid P2P packet JSON correctly and rejects malformed strings', () => {
  const packet = createP2PPacket('ping', 'device-a', { time: 123456 });
  const serialized = JSON.stringify(packet);
  const parsed = parseP2PPacket(serialized);
  assert.ok(parsed);
  assert.equal(parsed?.type, 'ping');
  assert.equal(parsed?.senderId, 'device-a');

  assert.equal(parseP2PPacket('invalid json'), null);
  assert.equal(parseP2PPacket('{"hello":"world"}'), null);
});

test('calculateFileChunks computes accurate chunk count for given size', () => {
  const res1 = calculateFileChunks(64000, 16384);
  assert.equal(res1.totalChunks, 4);
  assert.equal(res1.chunkSize, 16384);

  const res2 = calculateFileChunks(16384, 16384);
  assert.equal(res2.totalChunks, 1);

  const res3 = calculateFileChunks(0, 16384);
  assert.equal(res3.totalChunks, 1);
});

test('formatBytes formats file sizes with appropriate units', () => {
  assert.equal(formatBytes(0), '0 B');
  assert.equal(formatBytes(1024), '1 KB');
  assert.equal(formatBytes(1024 * 1024 * 2.5), '2.5 MB');
  assert.equal(formatBytes(1024 * 1024 * 1024), '1 GB');
});

test('formatDuration formats seconds to MM:SS', () => {
  assert.equal(formatDuration(0), '00:00');
  assert.equal(formatDuration(65), '01:05');
  assert.equal(formatDuration(3600), '60:00');
});

test('analyzeIceCandidate correctly identifies direct LAN host candidates without relay', () => {
  // Typical host candidate on LAN
  const hostCand = 'candidate:4234997325 1 udp 2122260223 192.168.1.105 52834 typ host generation 0';
  const analysis1 = analyzeIceCandidate(hostCand);
  assert.equal(analysis1.type, 'host');
  assert.equal(analysis1.protocol, 'UDP');
  assert.equal(analysis1.address, '192.168.1.105');
  assert.equal(analysis1.port, 52834);
  assert.equal(analysis1.isDirectLan, true);

  // Relay (TURN server - non-direct)
  const relayCand = 'candidate:12345 1 udp 16777215 198.51.100.2 60000 typ relay raddr 192.168.1.105 rport 52834';
  const analysis2 = analyzeIceCandidate(relayCand);
  assert.equal(analysis2.type, 'relay');
  assert.equal(analysis2.isDirectLan, false);
});

test('generateRoomCode produces LAN formatted room codes', () => {
  const code = generateRoomCode();
  assert.match(code, /^LAN-\d{4}$/);
});
