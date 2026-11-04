/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Laptop,
  Smartphone,
  Columns,
  Sparkles,
  Zap,
  Radio,
  ArrowRightLeft,
  ShieldCheck,
} from 'lucide-react';
import { Language, translations } from '../utils/i18n';
import { ChatMessage, IceCandidateInfo } from '../utils/p2pProtocol';
import { WebRTCManager } from '../utils/webrtcManager';
import { PCLayout } from './PCLayout';
import { PhoneView } from './PhoneView';
import { PhoneFrame } from './PhoneFrame';
import { CallOverlay } from './CallOverlay';

interface SplitScreenDemoProps {
  lang: Language;
  onOpenConnectModal: () => void;
  onOpenDiagnostics: () => void;
}

export const SplitScreenDemo: React.FC<SplitScreenDemoProps> = ({
  lang,
  onOpenConnectModal,
  onOpenDiagnostics,
}) => {
  const t = translations[lang];
  const sharedRoomId = 'LAN-DEMO';

  // --- PC State & Manager ---
  const [pcMessages, setPcMessages] = useState<ChatMessage[]>([
    {
      id: 'm1',
      sender: 'peer',
      senderName: 'هاتف سامسونج / آيفون',
      text: 'السلام عليكم! هادي نسخة التيليفون متصلة بالبيسي ديريكت فالويفي بدون سيرفر وسيط 🚀',
      timestamp: Date.now() - 60000,
      type: 'text',
    },
  ]);
  const [pcConnected, setPcConnected] = useState(true);
  const [pcTyping, setPcTyping] = useState(false);
  const [pcPing, setPcPing] = useState(2);
  const [pcTransfer, setPcTransfer] = useState<any>(null);

  // --- Phone State & Manager ---
  const [phoneMessages, setPhoneMessages] = useState<ChatMessage[]>([
    {
      id: 'm1',
      sender: 'me',
      senderName: 'هاتف سامسونج / آيفون',
      text: 'السلام عليكم! هادي نسخة التيليفون متصلة بالبيسي ديريكت فالويفي بدون سيرفر وسيط 🚀',
      timestamp: Date.now() - 60000,
      type: 'text',
    },
  ]);
  const [phoneConnected, setPhoneConnected] = useState(true);
  const [phoneTyping, setPhoneTyping] = useState(false);
  const [phonePing, setPhonePing] = useState(2);
  const [phoneTransfer, setPhoneTransfer] = useState<any>(null);

  // Call states
  const [callState, setCallState] = useState<{
    isInCall: boolean;
    callType: 'audio' | 'video' | null;
    initiator: 'pc' | 'phone' | null;
    isIncomingForOther: boolean;
  }>({
    isInCall: false,
    callType: null,
    initiator: null,
    isIncomingForOther: false,
  });

  const dummyIce: IceCandidateInfo = {
    type: 'host',
    protocol: 'UDP',
    address: '192.168.1.45',
    port: 54120,
    isDirectLan: true,
  };

  // Direct P2P Simulator: when PC sends, Phone receives instantly
  const handlePcSendMessage = (text: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    const now = Date.now();
    const pcMsg: ChatMessage = {
      id,
      sender: 'me',
      senderName: 'حاسوب محمول (PC)',
      text,
      timestamp: now,
      type: 'text',
    };
    const phoneMsg: ChatMessage = {
      id,
      sender: 'peer',
      senderName: 'حاسوب محمول (PC)',
      text,
      timestamp: now,
      type: 'text',
    };

    setPcMessages((prev) => [...prev, pcMsg]);
    setPhoneMessages((prev) => [...prev, phoneMsg]);
  };

  const handlePhoneSendMessage = (text: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    const now = Date.now();
    const phoneMsg: ChatMessage = {
      id,
      sender: 'me',
      senderName: 'هاتف محمول (Phone)',
      text,
      timestamp: now,
      type: 'text',
    };
    const pcMsg: ChatMessage = {
      id,
      sender: 'peer',
      senderName: 'هاتف محمول (Phone)',
      text,
      timestamp: now,
      type: 'text',
    };

    setPhoneMessages((prev) => [...prev, phoneMsg]);
    setPcMessages((prev) => [...prev, pcMsg]);
  };

  // Audio Note handlers
  const handlePcSendAudioNote = (audioUrl: string, duration: number) => {
    const id = Math.random().toString(36).substring(2, 9);
    const now = Date.now();
    setPcMessages((prev) => [
      ...prev,
      {
        id,
        sender: 'me',
        senderName: 'حاسوب محمول (PC)',
        text: 'Audio Note',
        timestamp: now,
        type: 'voice',
        audioUrl,
        audioDuration: duration,
      },
    ]);
    setPhoneMessages((prev) => [
      ...prev,
      {
        id,
        sender: 'peer',
        senderName: 'حاسوب محمول (PC)',
        text: 'Audio Note',
        timestamp: now,
        type: 'voice',
        audioUrl,
        audioDuration: duration,
      },
    ]);
  };

  const handlePhoneSendAudioNote = (audioUrl: string, duration: number) => {
    const id = Math.random().toString(36).substring(2, 9);
    const now = Date.now();
    setPhoneMessages((prev) => [
      ...prev,
      {
        id,
        sender: 'me',
        senderName: 'هاتف محمول (Phone)',
        text: 'Audio Note',
        timestamp: now,
        type: 'voice',
        audioUrl,
        audioDuration: duration,
      },
    ]);
    setPcMessages((prev) => [
      ...prev,
      {
        id,
        sender: 'peer',
        senderName: 'هاتف محمول (Phone)',
        text: 'Audio Note',
        timestamp: now,
        type: 'voice',
        audioUrl,
        audioDuration: duration,
      },
    ]);
  };

  // Direct P2P File Transfer Simulator (PC -> Phone or Phone -> PC)
  const handlePcSendFile = (file: File) => {
    simulateP2PFileTransfer(file, 'pc', 'phone');
  };

  const handlePhoneSendFile = (file: File) => {
    simulateP2PFileTransfer(file, 'phone', 'pc');
  };

  const simulateP2PFileTransfer = (file: File, from: 'pc' | 'phone', to: 'pc' | 'phone') => {
    const fileId = Math.random().toString(36).substring(2, 9);
    const totalBytes = file.size;
    let transferred = 0;
    const blobUrl = URL.createObjectURL(file);

    const interval = setInterval(() => {
      transferred += Math.min(totalBytes - transferred, Math.max(16384, Math.floor(totalBytes / 10)));
      const progress = Math.min(100, Math.round((transferred / totalBytes) * 100));

      const transferState = {
        fileId,
        fileName: file.name,
        progress,
        bytesTransferred: transferred,
        totalBytes,
        isReceiving: false,
        speedBps: 25 * 1024 * 1024, // 25 MB/s LAN speed
      };

      if (from === 'pc') {
        setPcTransfer(transferState);
        setPhoneTransfer({ ...transferState, isReceiving: true });
      } else {
        setPhoneTransfer(transferState);
        setPcTransfer({ ...transferState, isReceiving: true });
      }

      if (progress >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          setPcTransfer(null);
          setPhoneTransfer(null);

          const id = Math.random().toString(36).substring(2, 9);
          const msgSenderName = from === 'pc' ? 'حاسوب محمول (PC)' : 'هاتف محمول (Phone)';

          const fileInfo = {
            name: file.name,
            size: file.size,
            type: file.type,
            blobUrl,
          };

          setPcMessages((prev) => [
            ...prev,
            {
              id,
              sender: from === 'pc' ? 'me' : 'peer',
              senderName: msgSenderName,
              text: `File: ${file.name}`,
              timestamp: Date.now(),
              type: 'file',
              fileInfo,
            },
          ]);

          setPhoneMessages((prev) => [
            ...prev,
            {
              id,
              sender: from === 'phone' ? 'me' : 'peer',
              senderName: msgSenderName,
              text: `File: ${file.name}`,
              timestamp: Date.now(),
              type: 'file',
              fileInfo,
            },
          ]);
        }, 500);
      }
    }, 150);
  };

  // Calls
  const handleStartCall = (type: 'audio' | 'video', from: 'pc' | 'phone') => {
    setCallState({
      isInCall: false,
      callType: type,
      initiator: from,
      isIncomingForOther: true,
    });
  };

  const handleAcceptCall = () => {
    setCallState((prev) => ({
      ...prev,
      isInCall: true,
      isIncomingForOther: false,
    }));
  };

  const handleDeclineOrEndCall = () => {
    setCallState({
      isInCall: false,
      callType: null,
      initiator: null,
      isIncomingForOther: false,
    });
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 text-slate-100 overflow-hidden">
      {/* Top Banner explaining split-screen demo */}
      <div className="px-4 py-2 bg-gradient-to-r from-sky-950/80 via-slate-900 to-indigo-950/80 border-b border-slate-800 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <div className="p-1 bg-sky-500/20 text-sky-400 rounded-lg">
            <ArrowRightLeft className="w-4 h-4 animate-pulse" />
          </div>
          <span className="font-bold text-white">معاينة حية متزامنة (Live Split-Screen):</span>
          <span className="text-slate-300 hidden sm:inline">
            البيسي (على اليسار) والتيليفون (على اليمين) متصلين مباشرة بدون سيرفر وسيط
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono font-bold border border-emerald-500/30">
            P2P LAN • 2ms Ping
          </span>
        </div>
      </div>

      {/* Side-by-side workspace */}
      <div className="flex-1 grid grid-cols-1 xl:grid-cols-12 gap-4 p-3 sm:p-4 overflow-hidden">
        {/* Left 7 cols: PC Interface */}
        <div className="xl:col-span-7 h-full flex flex-col bg-slate-900/50 rounded-3xl border border-slate-800 overflow-hidden shadow-2xl relative">
          <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs font-bold text-slate-200">
            <div className="flex items-center gap-2">
              <Laptop className="w-4 h-4 text-sky-400" />
              <span>نسخة الحاسوب (PC Desktop Edition)</span>
            </div>
            <span className="text-[10px] font-mono bg-sky-500/10 text-sky-400 px-2 py-0.5 rounded border border-sky-500/30">
              User: Desktop PC
            </span>
          </div>

          <div className="flex-1 flex overflow-hidden relative">
            <PCLayout
              lang={lang}
              messages={pcMessages}
              peerName="هاتف ذكي (Phone)"
              isPeerTyping={phoneTyping}
              activeTransfer={pcTransfer}
              onSendMessage={handlePcSendMessage}
              onSendAudioNote={handlePcSendAudioNote}
              onSendFile={handlePcSendFile}
              onTyping={setPcTyping}
              onStartCall={(t) => handleStartCall(t, 'pc')}
              isConnected={pcConnected}
              roomId={sharedRoomId}
              pingMs={pcPing}
              iceInfo={dummyIce}
              onOpenConnectModal={onOpenConnectModal}
              onOpenDiagnostics={onOpenDiagnostics}
              isCompact={true}
            />

            {/* PC Call Overlay if PC is in call */}
            {callState.initiator === 'pc' && (callState.isInCall || callState.isIncomingForOther) && (
              <CallOverlay
                lang={lang}
                isInCall={callState.isInCall}
                isIncoming={false}
                callType={callState.callType}
                callerName="هاتف ذكي (Phone)"
                localStream={null}
                remoteStream={null}
                pingMs={pcPing}
                onAcceptCall={handleAcceptCall}
                onDeclineCall={handleDeclineOrEndCall}
                onEndCall={handleDeclineOrEndCall}
                onToggleMute={() => {}}
                onToggleCamera={() => {}}
                deviceType="pc"
              />
            )}
            {callState.initiator === 'phone' && callState.isIncomingForOther && (
              <CallOverlay
                lang={lang}
                isInCall={false}
                isIncoming={true}
                callType={callState.callType}
                callerName="هاتف ذكي (Phone)"
                localStream={null}
                remoteStream={null}
                pingMs={pcPing}
                onAcceptCall={handleAcceptCall}
                onDeclineCall={handleDeclineOrEndCall}
                onEndCall={handleDeclineOrEndCall}
                onToggleMute={() => {}}
                onToggleCamera={() => {}}
                deviceType="pc"
              />
            )}
          </div>
        </div>

        {/* Right 5 cols: Smartphone Frame */}
        <div className="xl:col-span-5 h-full flex flex-col items-center justify-center bg-slate-900/30 rounded-3xl border border-slate-800/80 p-2 sm:p-4 overflow-hidden">
          <div className="w-full flex items-center justify-between px-3 pb-2 text-xs font-bold text-slate-300">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-sky-400" />
              <span>نسخة الهاتف (Smartphone Edition)</span>
            </div>
            <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30">
              User: Mobile Phone
            </span>
          </div>

          <PhoneFrame>
            <PhoneView
              lang={lang}
              messages={phoneMessages}
              peerName="حاسوب محمول (PC)"
              isPeerTyping={pcTyping}
              activeTransfer={phoneTransfer}
              onSendMessage={handlePhoneSendMessage}
              onSendAudioNote={handlePhoneSendAudioNote}
              onSendFile={handlePhoneSendFile}
              onTyping={setPhoneTyping}
              onStartCall={(t) => handleStartCall(t, 'phone')}
              isConnected={phoneConnected}
              roomId={sharedRoomId}
              pingMs={phonePing}
              iceInfo={dummyIce}
              onOpenConnectModal={onOpenConnectModal}
              onOpenDiagnostics={onOpenDiagnostics}
            />

            {/* Phone Call Overlay if phone is in call */}
            {callState.initiator === 'phone' && (callState.isInCall || callState.isIncomingForOther) && (
              <CallOverlay
                lang={lang}
                isInCall={callState.isInCall}
                isIncoming={false}
                callType={callState.callType}
                callerName="حاسوب محمول (PC)"
                localStream={null}
                remoteStream={null}
                pingMs={phonePing}
                onAcceptCall={handleAcceptCall}
                onDeclineCall={handleDeclineOrEndCall}
                onEndCall={handleDeclineOrEndCall}
                onToggleMute={() => {}}
                onToggleCamera={() => {}}
                deviceType="phone"
              />
            )}
            {callState.initiator === 'pc' && callState.isIncomingForOther && (
              <CallOverlay
                lang={lang}
                isInCall={false}
                isIncoming={true}
                callType={callState.callType}
                callerName="حاسوب محمول (PC)"
                localStream={null}
                remoteStream={null}
                pingMs={phonePing}
                onAcceptCall={handleAcceptCall}
                onDeclineCall={handleDeclineOrEndCall}
                onEndCall={handleDeclineOrEndCall}
                onToggleMute={() => {}}
                onToggleCamera={() => {}}
                deviceType="phone"
              />
            )}
          </PhoneFrame>
        </div>
      </div>
    </div>
  );
};
