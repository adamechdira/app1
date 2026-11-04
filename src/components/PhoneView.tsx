/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  MessageSquare,
  Phone,
  FolderOpen,
  Activity,
  QrCode,
  Wifi,
  Radio,
  FileText,
  Download,
  Share2,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Language, translations } from '../utils/i18n';
import { ChatMessage, formatBytes, IceCandidateInfo } from '../utils/p2pProtocol';
import { ChatPanel } from './ChatPanel';

interface PhoneViewProps {
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
}

export const PhoneView: React.FC<PhoneViewProps> = ({
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
}) => {
  const t = translations[lang];
  const [activeTab, setActiveTab] = useState<'chats' | 'calls' | 'files' | 'network'>('chats');

  // Filter file messages
  const fileMessages = messages.filter((m) => m.type === 'file' && m.fileInfo);

  return (
    <div className="w-full h-full flex flex-col bg-slate-950 text-slate-100 overflow-hidden select-none">
      {/* Mobile Top Status Bar Simulation */}
      <div className="px-6 pt-2 pb-1 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-[11px] font-semibold text-slate-300">
        <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        <div className="flex items-center gap-2 text-slate-400">
          <Wifi className="w-3.5 h-3.5 text-sky-400" />
          <span className="text-[10px] bg-slate-800 px-1.5 py-0.2 rounded font-mono">5G</span>
          <div className="w-5 h-2.5 border border-slate-400 rounded-sm p-0.5 flex items-center">
            <div className="w-full h-full bg-emerald-400 rounded-2xs" />
          </div>
        </div>
      </div>

      {/* Main Tab Views */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {activeTab === 'chats' && (
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
            deviceType="phone"
          />
        )}

        {activeTab === 'calls' && (
          <div className="flex-1 p-4 space-y-4 overflow-y-auto">
            <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 mx-auto flex items-center justify-center text-white shadow-lg">
                <Phone className="w-7 h-7" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">مكالمات الند للند المباشرة (P2P)</h3>
                <p className="text-xs text-slate-400 mt-1">
                  صوت وفيديو بجودة عالية وبدون تقطيع عبر شبكة الواي فاي المنزلية.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => onStartCall('audio')}
                  disabled={!isConnected}
                  className="py-3 px-4 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-sky-400 font-semibold rounded-xl text-xs border border-slate-700 flex items-center justify-center gap-2"
                >
                  <Phone className="w-4 h-4" />
                  <span>{t.callVoice}</span>
                </button>
                <button
                  onClick={() => onStartCall('video')}
                  disabled={!isConnected}
                  className="py-3 px-4 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-semibold rounded-xl text-xs shadow-md shadow-sky-600/30 flex items-center justify-center gap-2"
                >
                  <Phone className="w-4 h-4" />
                  <span>{t.callVideo}</span>
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                معلومات المكالمة
              </h4>
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">حالة الربط:</span>
                  <span className={isConnected ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                    {isConnected ? 'متصل وجاهز للمكالمة' : 'غير متصل'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">زمن الاستجابة (Ping):</span>
                  <span className="text-sky-300 font-mono">{pingMs > 0 ? `${pingMs}ms` : '< 5ms'}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'files' && (
          <div className="flex-1 p-4 space-y-4 overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-sky-400" />
                <span>الملفات المنقولة محلياً</span>
              </h3>
              <span className="text-xs text-slate-400 font-mono">{fileMessages.length} ملفات</span>
            </div>

            {fileMessages.length === 0 ? (
              <div className="p-8 text-center bg-slate-900/60 rounded-2xl border border-slate-800 space-y-2">
                <FileText className="w-10 h-10 text-slate-600 mx-auto" />
                <p className="text-xs text-slate-400">ما كاين حتى ملف منقول حالياً.</p>
                <p className="text-[11px] text-slate-500">
                  يمكنك إرسال أي صورة أو فيديو أو وثيقة من شاشة الدردشة مباشرة.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {fileMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <div className="p-2 bg-sky-500/10 text-sky-400 rounded-lg">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="overflow-hidden">
                        <p className="font-semibold text-white truncate max-w-[150px]">
                          {msg.fileInfo?.name}
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono">
                          {formatBytes(msg.fileInfo?.size || 0)}
                        </p>
                      </div>
                    </div>
                    {msg.fileInfo?.blobUrl && (
                      <a
                        href={msg.fileInfo.blobUrl}
                        download={msg.fileInfo.name}
                        className="p-2 bg-slate-800 hover:bg-slate-700 text-sky-400 rounded-lg"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'network' && (
          <div className="flex-1 p-4 space-y-3 overflow-y-auto text-xs">
            <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
              <h4 className="font-bold text-sky-400 flex items-center gap-1.5">
                <Activity className="w-4 h-4" />
                <span>حالة الشبكة المحلية (Phone P2P)</span>
              </h4>
              <div className="space-y-1.5 text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-400">الغرفة الحالية:</span>
                  <span className="font-mono text-sky-300 font-bold">{roomId || '---'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">نوع الاتصال:</span>
                  <span className="text-emerald-400 font-semibold">
                    {iceInfo.type === 'host' ? 'Direct LAN (بدون سيرفر)' : iceInfo.type}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">سرعة الاستجابة:</span>
                  <span className="font-mono text-white">{pingMs > 0 ? `${pingMs}ms` : '< 2ms'}</span>
                </div>
              </div>
            </div>

            <button
              onClick={onOpenConnectModal}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl flex items-center justify-center gap-2"
            >
              <QrCode className="w-4 h-4 text-sky-400" />
              <span>إظهار كود الغرفة أو تغييرها</span>
            </button>
          </div>
        )}
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <div className="px-2 py-2 bg-slate-900 border-t border-slate-800 flex items-center justify-around">
        <button
          onClick={() => setActiveTab('chats')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
            activeTab === 'chats' ? 'text-sky-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <MessageSquare className="w-5 h-5" />
          <span className="text-[10px]">{t.chatsTab}</span>
        </button>

        <button
          onClick={() => setActiveTab('calls')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
            activeTab === 'calls' ? 'text-sky-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Phone className="w-5 h-5" />
          <span className="text-[10px]">{t.callsTab}</span>
        </button>

        <button
          onClick={() => setActiveTab('files')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
            activeTab === 'files' ? 'text-sky-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <FolderOpen className="w-5 h-5" />
          <span className="text-[10px]">{t.filesTab}</span>
        </button>

        <button
          onClick={() => setActiveTab('network')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
            activeTab === 'network' ? 'text-sky-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Activity className="w-5 h-5" />
          <span className="text-[10px]">{t.networkTab}</span>
        </button>
      </div>
    </div>
  );
};
