/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ChatMessage,
  FileTransferMeta,
  IceCandidateInfo,
  P2PPacket,
  analyzeIceCandidate,
  calculateFileChunks,
  createP2PPacket,
  parseP2PPacket,
} from './p2pProtocol';

export type ConnectionState = 'idle' | 'discovering' | 'connecting' | 'connected' | 'disconnected' | 'failed';

export interface P2PPeerEvents {
  onStateChange: (state: ConnectionState) => void;
  onMessage: (message: ChatMessage) => void;
  onPeerTyping: (isTyping: boolean) => void;
  onFileProgress: (transfer: {
    fileId: string;
    fileName: string;
    progress: number;
    bytesTransferred: number;
    totalBytes: number;
    isReceiving: boolean;
    speedBps: number;
  }) => void;
  onFileReceived: (file: { name: string; size: number; type: string; blobUrl: string }) => void;
  onRemoteStream: (stream: MediaStream) => void;
  onCallStateChange: (call: {
    isInCall: boolean;
    callType: 'audio' | 'video' | null;
    isIncoming: boolean;
    callerName?: string;
  }) => void;
  onStatsUpdate: (stats: {
    pingMs: number;
    bytesSent: number;
    bytesReceived: number;
    iceInfo: IceCandidateInfo;
    connectionType: string;
  }) => void;
}

export class WebRTCManager {
  public peerId: string;
  public peerName: string;
  public deviceType: 'pc' | 'phone';
  public roomId: string = '';
  public state: ConnectionState = 'idle';

  private pc: RTCPeerConnection | null = null;
  private dataChannel: RTCDataChannel | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private events: P2PPeerEvents;

  // Signalling
  private broadcastChannel: BroadcastChannel | null = null;
  private pollInterval: any = null;
  private lastPollTimestamp = 0;
  private isPolite = false;

  // File Transfer State
  private incomingFiles = new Map<
    string,
    {
      meta: FileTransferMeta;
      chunks: ArrayBuffer[];
      receivedBytes: number;
      startTime: number;
    }
  >();

  // Stats
  private bytesSent = 0;
  private bytesReceived = 0;
  private pingInterval: any = null;
  private currentPing = 0;
  private iceInfo: IceCandidateInfo = { type: 'unknown', protocol: 'unknown', isDirectLan: false };

  // Call state
  public isInCall = false;
  public callType: 'audio' | 'video' | null = null;
  public isIncomingCall = false;

  constructor(
    peerId: string,
    peerName: string,
    deviceType: 'pc' | 'phone',
    events: P2PPeerEvents
  ) {
    this.peerId = peerId;
    this.peerName = peerName;
    this.deviceType = deviceType;
    this.events = events;

    // Initialize cross-tab broadcast channel for instant multi-device / tab testing on LAN
    try {
      this.broadcastChannel = new BroadcastChannel('tawasol-p2p-local-bus');
      this.broadcastChannel.onmessage = (e) => this.handleSignalMessage(e.data);
    } catch {
      // BroadcastChannel not available in all contexts
    }
  }

  public updateProfile(name: string, deviceType: 'pc' | 'phone') {
    this.peerName = name;
    this.deviceType = deviceType;
  }

  /**
   * Initializes or re-initializes RTCPeerConnection
   */
  private createPeerConnection(): RTCPeerConnection {
    if (this.pc) {
      try {
        this.pc.close();
      } catch {
        // ignore
      }
    }

    // Direct P2P config: public STUN is only used to discover local interfaces. No TURN servers = NO relay!
    const config: RTCConfiguration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
      iceCandidatePoolSize: 2,
    };

    const pc = new RTCPeerConnection(config);
    this.pc = pc;

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        const analyzed = analyzeIceCandidate(event.candidate.candidate);
        if (analyzed.type === 'host' || !this.iceInfo.isDirectLan) {
          this.iceInfo = analyzed;
          this.emitStats();
        }
        this.sendSignal({
          type: 'candidate',
          candidate: event.candidate,
        });
      }
    };

    pc.onconnectionstatechange = () => {
      switch (pc.connectionState) {
        case 'connected':
          this.setState('connected');
          this.startPingMonitor();
          break;
        case 'connecting':
          this.setState('connecting');
          break;
        case 'disconnected':
        case 'failed':
          this.setState('disconnected');
          this.stopPingMonitor();
          break;
        case 'closed':
          this.setState('idle');
          this.stopPingMonitor();
          break;
      }
    };

    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        this.remoteStream = event.streams[0];
        this.events.onRemoteStream(this.remoteStream);
      }
    };

    pc.ondatachannel = (event) => {
      this.setupDataChannel(event.channel);
    };

    return pc;
  }

  private setupDataChannel(channel: RTCDataChannel) {
    this.dataChannel = channel;
    channel.binaryType = 'arraybuffer';

    channel.onopen = () => {
      this.setState('connected');
      this.startPingMonitor();
    };

    channel.onclose = () => {
      this.setState('disconnected');
      this.stopPingMonitor();
    };

    channel.onmessage = (event) => {
      if (typeof event.data === 'string') {
        const packet = parseP2PPacket(event.data);
        if (packet) {
          this.handlePacket(packet);
        }
      } else if (event.data instanceof ArrayBuffer) {
        this.handleBinaryData(event.data);
      }
    };
  }

  /**
   * Connects to a local LAN room
   */
  public async joinRoom(roomId: string, isInitiator = false) {
    this.roomId = roomId;
    this.isPolite = !isInitiator;
    this.setState('discovering');

    const pc = this.createPeerConnection();

    if (isInitiator) {
      // Create DataChannel if initiator
      const dc = pc.createDataChannel('tawasol-p2p-dc', {
        ordered: true,
      });
      this.setupDataChannel(dc);

      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        await this.sendSignal({ type: 'offer', sdp: offer });
      } catch (err) {
        console.error('Failed to create offer:', err);
      }
    }

    // Register with local signaling server
    this.startSignalingPolling();
  }

  /**
   * Send a signal message via both BroadcastChannel and Local Signaling Endpoint
   */
  public async sendSignal(signalData: any, toPeerId?: string) {
    const payload = {
      roomId: this.roomId,
      fromPeerId: this.peerId,
      toPeerId,
      name: this.peerName,
      deviceType: this.deviceType,
      data: signalData,
      timestamp: Date.now(),
    };

    // 1. BroadcastChannel (for instant multi-tab / side-by-side split screen)
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage(payload);
      } catch {
        // ignore
      }
    }

    // 2. HTTP Signal endpoint (for separate devices on same LAN)
    try {
      await fetch('/api/signal/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: this.roomId,
          fromPeerId: this.peerId,
          toPeerId,
          data: signalData,
        }),
      });
    } catch {
      // Ignore network errors if running air-gapped
    }
  }

  private startSignalingPolling() {
    this.stopSignalingPolling();

    // Register peer in room
    fetch('/api/signal/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomId: this.roomId,
        peerId: this.peerId,
        name: this.peerName,
        deviceType: this.deviceType,
      }),
    }).catch(() => {});

    this.pollInterval = setInterval(async () => {
      if (!this.roomId) return;
      try {
        const res = await fetch(
          `/api/signal/poll?roomId=${encodeURIComponent(this.roomId)}&peerId=${encodeURIComponent(
            this.peerId
          )}&since=${this.lastPollTimestamp}`
        );
        if (res.ok) {
          const json = await res.json();
          this.lastPollTimestamp = json.timestamp || Date.now();
          if (Array.isArray(json.messages)) {
            for (const msg of json.messages) {
              await this.handleSignalMessage(msg);
            }
          }
        }
      } catch {
        // Network/offline fallback
      }
    }, 1000);
  }

  private stopSignalingPolling() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }

  /**
   * Handle incoming signaling messages (Offer, Answer, ICE Candidate)
   */
  public async handleSignalMessage(message: any) {
    if (!message || message.fromPeerId === this.peerId || message.roomId !== this.roomId) {
      return;
    }

    const { data } = message;
    if (!data) return;

    if (!this.pc) {
      this.createPeerConnection();
    }
    const pc = this.pc!;

    try {
      if (data.type === 'offer') {
        const offerCollision = pc.signalingState !== 'stable';
        if (offerCollision && !this.isPolite) {
          return;
        }

        await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        await this.sendSignal({ type: 'answer', sdp: answer }, message.fromPeerId);
      } else if (data.type === 'answer') {
        if (pc.signalingState === 'have-local-offer') {
          await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
        }
      } else if (data.type === 'candidate' && data.candidate) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch (e) {
          // ignore duplicate/stale candidates
        }
      }
    } catch (err) {
      console.warn('Signaling processing error:', err);
    }
  }

  /**
   * Manual Air-gapped SDP methods
   */
  public async createManualOffer(): Promise<string> {
    const pc = this.createPeerConnection();
    const dc = pc.createDataChannel('tawasol-p2p-dc', { ordered: true });
    this.setupDataChannel(dc);

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    // Wait briefly for host ICE candidates to gather
    await new Promise((r) => setTimeout(r, 800));
    return JSON.stringify(pc.localDescription);
  }

  public async acceptManualOffer(offerJson: string): Promise<string> {
    const pc = this.createPeerConnection();
    const offer = JSON.parse(offerJson);
    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    await new Promise((r) => setTimeout(r, 800));
    return JSON.stringify(pc.localDescription);
  }

  public async acceptManualAnswer(answerJson: string): Promise<void> {
    if (!this.pc) return;
    const answer = JSON.parse(answerJson);
    await this.pc.setRemoteDescription(new RTCSessionDescription(answer));
  }

  /**
   * Handle parsed packets from RTCDataChannel
   */
  private handlePacket(packet: P2PPacket) {
    this.bytesReceived += JSON.stringify(packet).length;

    switch (packet.type) {
      case 'chat': {
        const payload = packet.payload as any;
        this.events.onMessage({
          id: payload.id,
          sender: 'peer',
          senderName: payload.senderName || 'Peer',
          text: payload.text,
          timestamp: packet.timestamp,
          type: 'text',
        });
        break;
      }
      case 'typing': {
        const payload = packet.payload as { isTyping: boolean };
        this.events.onPeerTyping(payload.isTyping);
        break;
      }
      case 'audio-note': {
        const payload = packet.payload as any;
        this.events.onMessage({
          id: payload.id,
          sender: 'peer',
          senderName: payload.senderName || 'Peer',
          text: 'Audio Note',
          timestamp: packet.timestamp,
          type: 'voice',
          audioUrl: payload.audioUrl,
          audioDuration: payload.duration,
        });
        break;
      }
      case 'file-meta': {
        const meta = packet.payload as FileTransferMeta;
        this.incomingFiles.set(meta.fileId, {
          meta,
          chunks: [],
          receivedBytes: 0,
          startTime: Date.now(),
        });
        break;
      }
      case 'file-ack': {
        // Reserved for flow control
        break;
      }
      case 'call-action': {
        const action = packet.payload as {
          action: 'invite' | 'accept' | 'reject' | 'end';
          callType?: 'audio' | 'video';
          callerName?: string;
        };

        if (action.action === 'invite') {
          this.isIncomingCall = true;
          this.callType = action.callType || 'audio';
          this.events.onCallStateChange({
            isInCall: false,
            callType: this.callType,
            isIncoming: true,
            callerName: action.callerName || 'Peer',
          });
        } else if (action.action === 'accept') {
          this.isInCall = true;
          this.isIncomingCall = false;
          this.events.onCallStateChange({
            isInCall: true,
            callType: this.callType,
            isIncoming: false,
          });
        } else if (action.action === 'reject' || action.action === 'end') {
          this.endCallInternal(false);
        }
        break;
      }
      case 'ping': {
        // Send pong back immediately
        const reply = createP2PPacket('pong', this.peerId, packet.payload);
        this.sendPacket(reply);
        break;
      }
      case 'pong': {
        const payload = packet.payload as { sendTime: number };
        if (payload && payload.sendTime) {
          this.currentPing = Math.max(1, Date.now() - payload.sendTime);
          this.emitStats();
        }
        break;
      }
    }
  }

  /**
   * Handle binary ArrayBuffer incoming from RTCDataChannel (File chunks)
   */
  private handleBinaryData(buffer: ArrayBuffer) {
    this.bytesReceived += buffer.byteLength;

    // Header layout:
    // First 36 bytes: fileId string (fixed length UUID or padded string)
    // Next 4 bytes: chunk index uint32
    // Rest: chunk payload
    if (buffer.byteLength < 40) return;

    const decoder = new TextDecoder();
    const fileId = decoder.decode(new Uint8Array(buffer, 0, 36)).trim();
    const view = new DataView(buffer, 36, 4);
    const chunkIndex = view.getUint32(0);
    const chunkData = buffer.slice(40);

    const fileSession = this.incomingFiles.get(fileId);
    if (!fileSession) return;

    fileSession.chunks[chunkIndex] = chunkData;
    fileSession.receivedBytes += chunkData.byteLength;

    const progress = Math.min(100, Math.round((fileSession.receivedBytes / fileSession.meta.fileSize) * 100));
    const elapsedSecs = (Date.now() - fileSession.startTime) / 1000 || 0.1;
    const speedBps = fileSession.receivedBytes / elapsedSecs;

    this.events.onFileProgress({
      fileId,
      fileName: fileSession.meta.fileName,
      progress,
      bytesTransferred: fileSession.receivedBytes,
      totalBytes: fileSession.meta.fileSize,
      isReceiving: true,
      speedBps,
    });

    // Check if all chunks received
    if (fileSession.chunks.filter(Boolean).length === fileSession.meta.totalChunks) {
      const blob = new Blob(fileSession.chunks, { type: fileSession.meta.fileType || 'application/octet-stream' });
      const blobUrl = URL.createObjectURL(blob);

      this.events.onFileReceived({
        name: fileSession.meta.fileName,
        size: fileSession.meta.fileSize,
        type: fileSession.meta.fileType,
        blobUrl,
      });

      this.incomingFiles.delete(fileId);
    }
  }

  /**
   * Send text chat message over DataChannel
   */
  public sendChatMessage(text: string): ChatMessage {
    const messageId = Math.random().toString(36).substring(2, 9);
    const packet = createP2PPacket('chat', this.peerId, {
      id: messageId,
      senderName: this.peerName,
      text,
    });

    this.sendPacket(packet);

    const chatMsg: ChatMessage = {
      id: messageId,
      sender: 'me',
      senderName: this.peerName,
      text,
      timestamp: Date.now(),
      type: 'text',
    };

    return chatMsg;
  }

  /**
   * Send audio note message over DataChannel
   */
  public sendAudioNote(audioUrl: string, duration: number): ChatMessage {
    const messageId = Math.random().toString(36).substring(2, 9);
    const packet = createP2PPacket('audio-note', this.peerId, {
      id: messageId,
      senderName: this.peerName,
      audioUrl,
      duration,
    });

    this.sendPacket(packet);

    const chatMsg: ChatMessage = {
      id: messageId,
      sender: 'me',
      senderName: this.peerName,
      text: 'Audio Note',
      timestamp: Date.now(),
      type: 'voice',
      audioUrl,
      audioDuration: duration,
    };

    return chatMsg;
  }

  /**
   * Send typing status
   */
  public sendTyping(isTyping: boolean) {
    const packet = createP2PPacket('typing', this.peerId, { isTyping });
    this.sendPacket(packet);
  }

  /**
   * Send a file chunk-by-chunk directly over RTCDataChannel
   */
  public async sendFile(file: File) {
    if (!this.dataChannel || this.dataChannel.readyState !== 'open') {
      throw new Error('DataChannel not connected');
    }

    const fileId = Math.random().toString(36).substring(2, 10).padEnd(36, ' ');
    const { totalChunks, chunkSize } = calculateFileChunks(file.size, 16384);

    const meta: FileTransferMeta = {
      fileId,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      totalChunks,
      chunkSize,
    };

    // 1. Send metadata packet
    this.sendPacket(createP2PPacket('file-meta', this.peerId, meta));

    const startTime = Date.now();
    let sentBytes = 0;

    // 2. Read and send chunks with backpressure handling
    const fileReader = new FileReader();

    for (let chunkIdx = 0; chunkIdx < totalChunks; chunkIdx++) {
      const start = chunkIdx * chunkSize;
      const end = Math.min(file.size, start + chunkSize);
      const slice = file.slice(start, end);

      const arrayBuffer = await slice.arrayBuffer();

      // Construct packet with 40-byte header: 36 bytes fileId, 4 bytes chunkIndex
      const packetBuffer = new Uint8Array(40 + arrayBuffer.byteLength);
      const encoder = new TextEncoder();
      packetBuffer.set(encoder.encode(fileId), 0);

      const view = new DataView(packetBuffer.buffer, 36, 4);
      view.setUint32(0, chunkIdx);
      packetBuffer.set(new Uint8Array(arrayBuffer), 40);

      // Backpressure check
      if (this.dataChannel.bufferedAmount > 256 * 1024) {
        await new Promise<void>((resolve) => {
          const check = () => {
            if (!this.dataChannel || this.dataChannel.bufferedAmount < 64 * 1024) {
              resolve();
            } else {
              setTimeout(check, 20);
            }
          };
          check();
        });
      }

      this.dataChannel.send(packetBuffer.buffer);
      sentBytes += arrayBuffer.byteLength;
      this.bytesSent += packetBuffer.buffer.byteLength;

      const progress = Math.min(100, Math.round((sentBytes / file.size) * 100));
      const elapsedSecs = (Date.now() - startTime) / 1000 || 0.1;
      const speedBps = sentBytes / elapsedSecs;

      this.events.onFileProgress({
        fileId,
        fileName: file.name,
        progress,
        bytesTransferred: sentBytes,
        totalBytes: file.size,
        isReceiving: false,
        speedBps,
      });

      // Small pause to yield loop
      if (chunkIdx % 10 === 0) {
        await new Promise((r) => setTimeout(r, 5));
      }
    }
  }

  /**
   * Start voice or video call
   */
  public async startCall(type: 'audio' | 'video') {
    this.callType = type;
    this.isInCall = true;

    // Request media
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: type === 'video',
      });

      if (this.pc) {
        this.localStream.getTracks().forEach((track) => {
          this.pc!.addTrack(track, this.localStream!);
        });

        // Renegotiate SDP if needed
        const offer = await this.pc.createOffer();
        await this.pc.setLocalDescription(offer);
        await this.sendSignal({ type: 'offer', sdp: offer });
      }

      // Notify peer over DataChannel
      this.sendPacket(
        createP2PPacket('call-action', this.peerId, {
          action: 'invite',
          callType: type,
          callerName: this.peerName,
        })
      );

      this.events.onCallStateChange({
        isInCall: true,
        callType: type,
        isIncoming: false,
      });

      return this.localStream;
    } catch (err) {
      console.warn('Could not acquire media devices for call:', err);
      // Fallback dummy audio stream if camera/mic blocked in container
      this.localStream = this.createSyntheticMediaStream(type);
      return this.localStream;
    }
  }

  public async acceptIncomingCall() {
    this.isInCall = true;
    this.isIncomingCall = false;

    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: this.callType === 'video',
      });
    } catch {
      this.localStream = this.createSyntheticMediaStream(this.callType || 'audio');
    }

    if (this.pc && this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        this.pc!.addTrack(track, this.localStream!);
      });

      const offer = await this.pc.createOffer();
      await this.pc.setLocalDescription(offer);
      await this.sendSignal({ type: 'offer', sdp: offer });
    }

    this.sendPacket(
      createP2PPacket('call-action', this.peerId, {
        action: 'accept',
      })
    );

    this.events.onCallStateChange({
      isInCall: true,
      callType: this.callType,
      isIncoming: false,
    });
  }

  public declineIncomingCall() {
    this.sendPacket(
      createP2PPacket('call-action', this.peerId, {
        action: 'reject',
      })
    );
    this.endCallInternal(false);
  }

  public endCall() {
    this.sendPacket(
      createP2PPacket('call-action', this.peerId, {
        action: 'end',
      })
    );
    this.endCallInternal(true);
  }

  private endCallInternal(notify = true) {
    this.isInCall = false;
    this.isIncomingCall = false;
    this.callType = null;

    if (this.localStream) {
      this.localStream.getTracks().forEach((t) => t.stop());
      this.localStream = null;
    }

    if (notify) {
      this.events.onCallStateChange({
        isInCall: false,
        callType: null,
        isIncoming: false,
      });
    }
  }

  public toggleMute(muted: boolean) {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach((t) => (t.enabled = !muted));
    }
  }

  public toggleCamera(enabled: boolean) {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach((t) => (t.enabled = enabled));
    }
  }

  public getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  public getRemoteStream(): MediaStream | null {
    return this.remoteStream;
  }

  /**
   * Generates a synthetic test media stream for environments without physical mic/webcam
   */
  private createSyntheticMediaStream(type: 'audio' | 'video'): MediaStream {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 0, 640, 480);
        ctx.fillStyle = '#38bdf8';
        ctx.font = '24px sans-serif';
        ctx.fillText('Tawasol P2P Camera Feed', 50, 240);
      }
      const stream = canvas.captureStream ? canvas.captureStream(15) : new MediaStream();
      return stream;
    } catch {
      return new MediaStream();
    }
  }

  private sendPacket(packet: P2PPacket) {
    if (!this.dataChannel || this.dataChannel.readyState !== 'open') {
      return;
    }
    const raw = JSON.stringify(packet);
    this.dataChannel.send(raw);
    this.bytesSent += raw.length;
    this.emitStats();
  }

  private startPingMonitor() {
    this.stopPingMonitor();
    this.pingInterval = setInterval(() => {
      if (this.dataChannel && this.dataChannel.readyState === 'open') {
        const pingPacket = createP2PPacket('ping', this.peerId, { sendTime: Date.now() });
        this.sendPacket(pingPacket);
      }
    }, 2000);
  }

  private stopPingMonitor() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private emitStats() {
    this.events.onStatsUpdate({
      pingMs: this.currentPing,
      bytesSent: this.bytesSent,
      bytesReceived: this.bytesReceived,
      iceInfo: this.iceInfo,
      connectionType: this.iceInfo.isDirectLan ? 'Direct LAN Host (Zero Relay)' : 'P2P Direct',
    });
  }

  private setState(state: ConnectionState) {
    this.state = state;
    this.events.onStateChange(state);
  }

  public disconnect() {
    this.stopSignalingPolling();
    this.stopPingMonitor();
    this.endCallInternal(true);

    if (this.dataChannel) {
      try {
        this.dataChannel.close();
      } catch {}
      this.dataChannel = null;
    }

    if (this.pc) {
      try {
        this.pc.close();
      } catch {}
      this.pc = null;
    }

    this.setState('disconnected');
  }
}
