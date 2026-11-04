/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ChatMessage {
  id: string;
  sender: 'me' | 'peer';
  senderName: string;
  text: string;
  timestamp: number;
  type: 'text' | 'voice' | 'file';
  audioUrl?: string;
  audioDuration?: number;
  fileInfo?: {
    name: string;
    size: number;
    type: string;
    blobUrl?: string;
  };
}

export interface FileTransferMeta {
  fileId: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  totalChunks: number;
  chunkSize: number;
}

export interface IceCandidateInfo {
  type: 'host' | 'srflx' | 'prflx' | 'relay' | 'unknown';
  protocol: string;
  address?: string;
  port?: number;
  isDirectLan: boolean;
  rawCandidate?: string;
}

export type PacketType =
  | 'chat'
  | 'typing'
  | 'audio-note'
  | 'file-meta'
  | 'file-chunk'
  | 'file-ack'
  | 'ping'
  | 'pong'
  | 'call-action';

export interface P2PPacket<T = unknown> {
  version: 1;
  type: PacketType;
  senderId: string;
  timestamp: number;
  payload: T;
}

/**
 * Creates a standard P2P packet for transmission over RTCDataChannel.
 */
export function createP2PPacket<T>(type: PacketType, senderId: string, payload: T): P2PPacket<T> {
  return {
    version: 1,
    type,
    senderId,
    timestamp: Date.now(),
    payload,
  };
}

/**
 * Validates and parses raw incoming string data from RTCDataChannel.
 */
export function parseP2PPacket(raw: string): P2PPacket | null {
  try {
    const data = JSON.parse(raw);
    if (data && data.version === 1 && typeof data.type === 'string') {
      return data as P2PPacket;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Computes chunk calculation for P2P file transfers.
 * Default chunk size is 16384 bytes (16KB safe RTCDataChannel budget).
 */
export function calculateFileChunks(fileSize: number, chunkSize = 16384): { totalChunks: number; chunkSize: number } {
  const safeChunkSize = Math.max(1024, chunkSize);
  const totalChunks = Math.ceil(fileSize / safeChunkSize) || 1;
  return {
    totalChunks,
    chunkSize: safeChunkSize,
  };
}

/**
 * Formats bytes to readable string (e.g., 2.4 MB).
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const normalizedIndex = Math.min(i, sizes.length - 1);
  return `${parseFloat((bytes / Math.pow(k, normalizedIndex)).toFixed(dm))} ${sizes[normalizedIndex]}`;
}

/**
 * Formats seconds into MM:SS format.
 */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Parses an ICE candidate string to extract candidate type and direct LAN status.
 * 'host' candidates mean direct connection between network devices (No Relay / Direct LAN).
 */
export function analyzeIceCandidate(candidateStr: string): IceCandidateInfo {
  if (!candidateStr) {
    return { type: 'unknown', protocol: 'unknown', isDirectLan: false };
  }

  const parts = candidateStr.split(' ');
  // Standard format: candidate:foundation component protocol priority ip port typ type ...
  // Typically parts[2] is protocol, parts[4] is IP, parts[5] is port, parts[7] is candidate type.
  let type: IceCandidateInfo['type'] = 'unknown';
  const typeIndex = parts.indexOf('typ');
  if (typeIndex !== -1 && parts[typeIndex + 1]) {
    const rawType = parts[typeIndex + 1].toLowerCase();
    if (rawType === 'host' || rawType === 'srflx' || rawType === 'relay' || rawType === 'prflx') {
      type = rawType;
    }
  }

  const protocol = (parts[2] || 'udp').toUpperCase();
  const address = parts[4] || '';
  const port = parseInt(parts[5], 10) || undefined;

  // Check if private / LAN IP (192.168.x.x, 10.x.x.x, 172.16-31.x.x, or 127.0.0.1)
  const isPrivateIp =
    address.startsWith('192.168.') ||
    address.startsWith('10.') ||
    address === '127.0.0.1' ||
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(address);

  const isDirectLan = type === 'host' && (isPrivateIp || address.includes('.local') || address.includes(':'));

  return {
    type,
    protocol,
    address,
    port,
    isDirectLan: type === 'host', // all host candidates are direct peer-to-peer without server relay
    rawCandidate: candidateStr,
  };
}

/**
 * Generates a clean human-readable short peer code (e.g. "LAN-8492")
 */
export function generateRoomCode(): string {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `LAN-${num}`;
}
