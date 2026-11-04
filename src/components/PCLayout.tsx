/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Laptop,
  Smartphone,
  Wifi,
  Phone,
  Video,
  FileText,
  Paperclip,
  QrCode,
  ShieldCheck,
  Activity,
  Layers,
  ArrowRight,
  Copy,
  Check,
  Share2,
  HardDrive,
  Radio,
  ServerOff,
} from 'lucide-react';
import QRCode from 'qrcode';
import { Language, translations } from '../utils/i18n';
import { ChatMessage, formatBytes, IceCandidateInfo } from '../utils/p2pProtocol';
import { ChatPanel } from './ChatPanel';

interface PCLayoutProps {
  lang: Language;
  messages: ChatMessage[];
  peerName: string;
  isPeerTyping: boolean;
  activeTransfer: any;
  onSendMessage: (text: string) => void;
  onSendAudioNote: (audioUrl: string, duration: number) => void;
  onSendFile: (file: File) => void;
  onTyping: (isTyping: boolean) => void;
  onStartCall: (type: 'audio' | 'video') => void;
  isConnected: boolean;
  roomId: string;
  pingMs: number;
  iceInfo: IceCandidateInfo;
  onOpenConnectModal: () => void;
  onOpenDiagnostics: () => void;
  isCompact?: boolean;
}

export const PCLayout: React.FC<PCLayoutProps> = ({
  lang,
  messages,
  peerName,
  isPeerTyping,
  activeTransfer,
  onSendMessage,
  onSendAudioNote,
  onSendFile,
  onTyping,
  onStartCall,
  isConnected,
  roomId,
  pingMs,
  iceInfo,
  onOpenConnectModal,
  onOpenDiagnostics,
  isCompact = false,
}) => {
  const t = translations[lang];
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (roomId) {
      const shareUrl = `${window.location.origin}${window.location.pathname}?room=${roomId}`;
      QRCode.toDataURL(shareUrl, {
        width: 180,
        margin: 1,
        color: { dark: '#38bdf8', light: '#090d16' },
      }).then(setQrDataUrl).catch(() => {});
    }
  }, [roomId]);

  const handleCopy = () => {
    const shareUrl = `${window.location.origin}${window.location.pathname}?room=${roomId}`;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 flex overflow-hidden w-full h-full bg-slate-950 text-slate-100">
      {/* Left Desktop Sidebar */}
      <aside
        className={`${
          isCompact ? 'w-60 hidden 2xl:flex' : 'w-72 hidden md:flex'
        } border-r border-slate-800 bg-slate-900/70 flex flex-col justify-between p-3.5`}
      >
        <div className="space-y-4">
          {/* Peer Card */}
          <div className="p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                الجهاز المتصل (Peer)
              </span>
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'
                }`}
              />
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                  {peerName.slice(0, 2).toUpperCase()}
                </div>
                {isConnected && (
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-slate-950 rounded-full" />
                )}
              </div>
              <div className="overflow-hidden">
                <h3 className="font-bold text-sm text-white truncate">{peerName}</h3>
                <p className="text-[10px] text-slate-400 truncate">
                  {isConnected ? 'متصل ومحمي P2P' : 'في انتظار الاتصال...'}
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => onStartCall('audio')}
                disabled={!isConnected}
                className="py-2 px-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-sky-400 hover:text-white rounded-xl text-xs font-semibold border border-slate-700 flex items-center justify-center gap-1.5 transition-colors"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>صوت</span>
              </button>
              <button
                onClick={() => onStartCall('video')}
                disabled={!isConnected}
                className="py-2 px-2.5 bg-sky-600/30 hover:bg-sky-600 disabled:opacity-40 text-sky-300 hover:text-white rounded-xl text-xs font-semibold border border-sky-500/40 flex items-center justify-center gap-1.5 transition-colors"
              >
                <Video className="w-3.5 h-3.5" />
                <span>فيديو</span>
              </button>
            </div>
          </div>

          {/* Local Room Card */}
          <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">غرفة الويفي:</span>
              <span className="font-mono text-sky-400 font-bold">{roomId || '---'}</span>
            </div>

            <button
              onClick={handleCopy}
              className="w-full py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl border border-slate-700 flex items-center justify-center gap-2 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'تم النسخ!' : 'نسخ رابط الغرفة'}</span>
            </button>
          </div>

          {/* Skype Heritage Badge */}
          <div className="p-3 bg-sky-950/20 rounded-2xl border border-sky-800/30 text-xs space-y-1.5 text-slate-300">
            <div className="flex items-center gap-2 font-bold text-sky-400">
              <ServerOff className="w-4 h-4 text-emerald-400" />
              <span>معمارية سكايب الحرة</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-400">
              لا توجد خوادم تخزن أو تقرأ محادثاتك. الاتصال يمر مباشرة بين كارت شبكة البيسي والتيليفون.
            </p>
          </div>
        </div>

        {/* Diagnostics Trigger footer */}
        <button
          onClick={onOpenDiagnostics}
          className="p-2.5 bg-slate-950/80 hover:bg-slate-900 border border-slate-800 rounded-xl text-xs flex items-center justify-between text-slate-400 hover:text-slate-200 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            <span>فحص الشبكة و Ping</span>
          </div>
          <span className="font-mono text-sky-400 font-bold">{pingMs > 0 ? `${pingMs}ms` : '< 2ms'}</span>
        </button>
      </aside>

      {/* Center Chat Panel */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <ChatPanel
          lang={lang}
          messages={messages}
          peerName={peerName}
          isPeerTyping={isPeerTyping}
          activeTransfer={activeTransfer}
          onSendMessage={onSendMessage}
          onSendAudioNote={onSendAudioNote}
          onSendFile={onSendFile}
          onTyping={onTyping}
          onStartCall={onStartCall}
          isConnected={isConnected}
          deviceType="pc"
        />
      </main>

      {/* Right Desktop Info & QR Sidebar (Only if not in compact split mode) */}
      {!isCompact && (
        <aside className="w-72 border-l border-slate-800 bg-slate-900/70 p-4 hidden lg:flex flex-col justify-between">
          <div className="space-y-4">
            <div className="text-center space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-center gap-1.5">
                <QrCode className="w-4 h-4 text-sky-400" />
                <span>اربط التيليفون ديالك</span>
              </h4>
              <p className="text-[11px] text-slate-400">
                سكاني هاد الكود بكاميرا التيليفون باش يتصل مع هاد البيسي فالبلاصة:
              </p>
            </div>

            {/* QR Code Container */}
            {qrDataUrl && (
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col items-center justify-center shadow-lg">
                <img
                  src={qrDataUrl}
                  alt="Quick QR"
                  className="w-44 h-44 rounded-lg object-contain"
                />
                <span className="mt-2 text-[10px] font-mono text-sky-400">{roomId}</span>
              </div>
            )}

            {/* Connection diagnostics card */}
            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">نوع المسار:</span>
                <span className="font-bold text-emerald-400">Direct LAN</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">السرعة:</span>
                <span className="font-mono text-sky-300">LAN Speed (~1000 Mbps)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">الخادم الوسيط:</span>
                <span className="text-slate-300">منعدم 100%</span>
              </div>
            </div>
          </div>

          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center text-xs text-emerald-400 font-medium">
            جاهز للتواصل ومشاركة الملفات والمكالمات
          </div>
        </aside>
      )}
    </div>
  );
};
