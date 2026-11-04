/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Language, translations } from './utils/i18n';
import { ChatMessage, IceCandidateInfo, generateRoomCode } from './utils/p2pProtocol';
import { WebRTCManager, ConnectionState } from './utils/webrtcManager';
import { Header } from './components/Header';
import { PCLayout } from './components/PCLayout';
import { PhoneView } from './components/PhoneView';
import { PhoneFrame } from './components/PhoneFrame';
import { SplitScreenDemo } from './components/SplitScreenDemo';
import { ConnectionModal } from './components/ConnectionModal';
import { DiagnosticsModal } from './components/DiagnosticsModal';
import { CallOverlay } from './components/CallOverlay';

export default function App() {
  const [lang, setLang] = useState<Language>('darija');
  const [viewMode, setViewMode] = useState<'pc' | 'phone' | 'split'>('pc');
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [isDiagnosticsOpen, setIsDiagnosticsOpen] = useState(false);

  // Connection & Room state
  const [roomId, setRoomId] = useState<string>('');
  const [connectionState, setConnectionState] = useState<ConnectionState>('idle');
  const [peerName, setPeerName] = useState<string>('الجهاز الآخر');
  const [isPeerTyping, setIsPeerTyping] = useState<boolean>(false);

  // Messages & Files
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeTransfer, setActiveTransfer] = useState<{
    fileId: string;
    fileName: string;
    progress: number;
    bytesTransferred: number;
    totalBytes: number;
    isReceiving: boolean;
    speedBps: number;
  } | null>(null);

  // Calls & Media
  const [callState, setCallState] = useState<{
    isInCall: boolean;
    callType: 'audio' | 'video' | null;
    isIncoming: boolean;
    callerName?: string;
  }>({
    isInCall: false,
    callType: null,
    isIncoming: false,
  });
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  // Network stats
  const [stats, setStats] = useState<{
    pingMs: number;
    bytesSent: number;
    bytesReceived: number;
    iceInfo: IceCandidateInfo;
    connectionType: string;
  }>({
    pingMs: 0,
    bytesSent: 0,
    bytesReceived: 0,
    iceInfo: { type: 'host', protocol: 'UDP', isDirectLan: true },
    connectionType: 'Direct LAN Host (Zero Relay)',
  });

  const managerRef = useRef<WebRTCManager | null>(null);
  const myPeerIdRef = useRef<string>(Math.random().toString(36).substring(2, 9));

  // Determine initial view mode based on screen width & URL params
  useEffect(() => {
    if (window.innerWidth < 768) {
      setViewMode('phone');
    }

    const params = new URLSearchParams(window.location.search);
    const urlRoom = params.get('room');
    const targetRoom = urlRoom || generateRoomCode();
    setRoomId(targetRoom);

    // Initial welcome message explaining P2P Skype mechanics
    setMessages([
      {
        id: 'welcome',
        sender: 'peer',
        senderName: 'Tawasol P2P System',
        text: 'مرحباً بك! هاد التطبيق كيتواصل مباشرة من جهاز لجهاز (P2P) فالشبكة المحلية بلا سيرفر وسيط. فتح نفس الغرفة فالبيسي والتيليفون، أو جرب وضع الشاشة المزدوجة (Split View) لتجربة الاتصال في نفس الوقت! 🚀',
        timestamp: Date.now(),
        type: 'text',
      },
    ]);

    // Initialize WebRTC Manager
    const device = window.innerWidth < 768 ? 'phone' : 'pc';
    const manager = new WebRTCManager(
      myPeerIdRef.current,
      device === 'pc' ? 'بيسي (Desktop PC)' : 'تيليفون (Smartphone)',
      device,
      {
        onStateChange: (state) => {
          setConnectionState(state);
          if (state === 'connected') {
            confetti({
              particleCount: 50,
              spread: 60,
              origin: { y: 0.6 },
            });
          }
        },
        onMessage: (msg) => {
          setMessages((prev) => [...prev, msg]);
        },
        onPeerTyping: (typing) => {
          setIsPeerTyping(typing);
        },
        onFileProgress: (transfer) => {
          setActiveTransfer(transfer);
        },
        onFileReceived: (file) => {
          setActiveTransfer(null);
          setMessages((prev) => [
            ...prev,
            {
              id: Math.random().toString(36).substring(2, 9),
              sender: 'peer',
              senderName: peerName,
              text: `استلمت ملفاً جديداً: ${file.name}`,
              timestamp: Date.now(),
              type: 'file',
              fileInfo: file,
            },
          ]);
        },
        onRemoteStream: (stream) => {
          setRemoteStream(stream);
        },
        onCallStateChange: (call) => {
          setCallState(call);
          if (call.isInCall) {
            setLocalStream(manager.getLocalStream());
            setRemoteStream(manager.getRemoteStream());
          }
        },
        onStatsUpdate: (newStats) => {
          setStats(newStats);
        },
      }
    );

    managerRef.current = manager;

    // Auto connect to room
    manager.joinRoom(targetRoom, false);

    return () => {
      manager.disconnect();
    };
  }, []);

  const handleJoinRoom = (newRoom: string, isInitiator = false) => {
    setRoomId(newRoom);
    if (managerRef.current) {
      managerRef.current.joinRoom(newRoom, isInitiator);
    }
  };

  const handleSendMessage = (text: string) => {
    if (managerRef.current) {
      const msg = managerRef.current.sendChatMessage(text);
      setMessages((prev) => [...prev, msg]);
    }
  };

  const handleSendAudioNote = (audioUrl: string, duration: number) => {
    if (managerRef.current) {
      const msg = managerRef.current.sendAudioNote(audioUrl, duration);
      setMessages((prev) => [...prev, msg]);
    }
  };

  const handleSendFile = async (file: File) => {
    if (managerRef.current) {
      try {
        await managerRef.current.sendFile(file);
        setMessages((prev) => [
          ...prev,
          {
            id: Math.random().toString(36).substring(2, 9),
            sender: 'me',
            senderName: 'أنا',
            text: `أرسلت ملفاً: ${file.name}`,
            timestamp: Date.now(),
            type: 'file',
            fileInfo: {
              name: file.name,
              size: file.size,
              type: file.type,
              blobUrl: URL.createObjectURL(file),
            },
          },
        ]);
        setActiveTransfer(null);
      } catch (err) {
        console.error('File send error:', err);
      }
    }
  };

  const handleTyping = (typing: boolean) => {
    if (managerRef.current) {
      managerRef.current.sendTyping(typing);
    }
  };

  const handleStartCall = async (type: 'audio' | 'video') => {
    if (managerRef.current) {
      const stream = await managerRef.current.startCall(type);
      setLocalStream(stream);
    }
  };

  const handleAcceptCall = async () => {
    if (managerRef.current) {
      await managerRef.current.acceptIncomingCall();
      setLocalStream(managerRef.current.getLocalStream());
    }
  };

  const handleDeclineCall = () => {
    if (managerRef.current) {
      managerRef.current.declineIncomingCall();
    }
  };

  const handleEndCall = () => {
    if (managerRef.current) {
      managerRef.current.endCall();
    }
  };

  const handleDisconnect = () => {
    if (managerRef.current) {
      managerRef.current.disconnect();
    }
  };

  return (
    <div
      dir={lang === 'en' ? 'ltr' : 'rtl'}
      className="flex flex-col h-screen w-screen bg-slate-950 font-sans text-slate-100 overflow-hidden select-none"
    >
      {/* Universal Header */}
      <Header
        lang={lang}
        onLanguageChange={setLang}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        connectionState={connectionState}
        roomId={roomId}
        pingMs={stats.pingMs}
        onOpenConnectModal={() => setIsConnectModalOpen(true)}
        onOpenDiagnostics={() => setIsDiagnosticsOpen(true)}
        onDisconnect={handleDisconnect}
      />

      {/* Main View Switcher */}
      <div className="flex-1 flex overflow-hidden relative">
        {viewMode === 'split' ? (
          <SplitScreenDemo
            lang={lang}
            onOpenConnectModal={() => setIsConnectModalOpen(true)}
            onOpenDiagnostics={() => setIsDiagnosticsOpen(true)}
          />
        ) : viewMode === 'phone' ? (
          <div className="flex-1 flex items-center justify-center sm:p-4 bg-slate-950 overflow-hidden w-full h-full">
            <div className="hidden sm:block">
              <PhoneFrame>
                <PhoneView
                  lang={lang}
                  messages={messages}
                  peerName={peerName}
                  isPeerTyping={isPeerTyping}
                  activeTransfer={activeTransfer}
                  onSendMessage={handleSendMessage}
                  onSendAudioNote={handleSendAudioNote}
                  onSendFile={handleSendFile}
                  onTyping={handleTyping}
                  onStartCall={handleStartCall}
                  isConnected={connectionState === 'connected'}
                  roomId={roomId}
                  pingMs={stats.pingMs}
                  iceInfo={stats.iceInfo}
                  onOpenConnectModal={() => setIsConnectModalOpen(true)}
                  onOpenDiagnostics={() => setIsDiagnosticsOpen(true)}
                />
              </PhoneFrame>
            </div>
            <div className="block sm:hidden w-full h-full">
              <PhoneView
                lang={lang}
                messages={messages}
                peerName={peerName}
                isPeerTyping={isPeerTyping}
                activeTransfer={activeTransfer}
                onSendMessage={handleSendMessage}
                onSendAudioNote={handleSendAudioNote}
                onSendFile={handleSendFile}
                onTyping={handleTyping}
                onStartCall={handleStartCall}
                isConnected={connectionState === 'connected'}
                roomId={roomId}
                pingMs={stats.pingMs}
                iceInfo={stats.iceInfo}
                onOpenConnectModal={() => setIsConnectModalOpen(true)}
                onOpenDiagnostics={() => setIsDiagnosticsOpen(true)}
              />
            </div>
          </div>
        ) : (
          <PCLayout
            lang={lang}
            messages={messages}
            peerName={peerName}
            isPeerTyping={isPeerTyping}
            activeTransfer={activeTransfer}
            onSendMessage={handleSendMessage}
            onSendAudioNote={handleSendAudioNote}
            onSendFile={handleSendFile}
            onTyping={handleTyping}
            onStartCall={handleStartCall}
            isConnected={connectionState === 'connected'}
            roomId={roomId}
            pingMs={stats.pingMs}
            iceInfo={stats.iceInfo}
            onOpenConnectModal={() => setIsConnectModalOpen(true)}
            onOpenDiagnostics={() => setIsDiagnosticsOpen(true)}
          />
        )}
      </div>

      {/* Call Overlay (Voice / Video) */}
      <CallOverlay
        lang={lang}
        isInCall={callState.isInCall}
        isIncoming={callState.isIncoming}
        callType={callState.callType}
        callerName={callState.callerName || peerName}
        localStream={localStream}
        remoteStream={remoteStream}
        pingMs={stats.pingMs}
        onAcceptCall={handleAcceptCall}
        onDeclineCall={handleDeclineCall}
        onEndCall={handleEndCall}
        onToggleMute={(m) => managerRef.current?.toggleMute(m)}
        onToggleCamera={(c) => managerRef.current?.toggleCamera(c)}
        deviceType={viewMode === 'phone' ? 'phone' : 'pc'}
      />

      {/* Connection & QR Modal */}
      <ConnectionModal
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
        lang={lang}
        currentRoom={roomId}
        onJoinRoom={handleJoinRoom}
        onManualOfferCreate={() => managerRef.current!.createManualOffer()}
        onManualOfferAccept={(offer) => managerRef.current!.acceptManualOffer(offer)}
        onManualAnswerAccept={(ans) => managerRef.current!.acceptManualAnswer(ans)}
        deviceType={viewMode === 'phone' ? 'phone' : 'pc'}
      />

      {/* Diagnostics Modal */}
      <DiagnosticsModal
        isOpen={isDiagnosticsOpen}
        onClose={() => setIsDiagnosticsOpen(false)}
        lang={lang}
        pingMs={stats.pingMs}
        bytesSent={stats.bytesSent}
        bytesReceived={stats.bytesReceived}
        iceInfo={stats.iceInfo}
        roomId={roomId}
        peerId={myPeerIdRef.current}
        isConnected={connectionState === 'connected'}
      />
    </div>
  );
}
