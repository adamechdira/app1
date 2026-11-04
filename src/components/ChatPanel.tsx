/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Paperclip,
  Mic,
  Square,
  Phone,
  Video,
  Download,
  FileText,
  Play,
  Pause,
  CheckCheck,
  ShieldCheck,
  Smile,
  AlertCircle,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Language, translations } from '../utils/i18n';
import { ChatMessage, formatBytes, formatDuration } from '../utils/p2pProtocol';

interface ChatPanelProps {
  lang: Language;
  messages: ChatMessage[];
  peerName: string;
  isPeerTyping: boolean;
  activeTransfer: {
    fileId: string;
    fileName: string;
    progress: number;
    bytesTransferred: number;
    totalBytes: number;
    isReceiving: boolean;
    speedBps: number;
  } | null;
  onSendMessage: (text: string) => void;
  onSendAudioNote: (audioUrl: string, duration: number) => void;
  onSendFile: (file: File) => void;
  onTyping: (isTyping: boolean) => void;
  onStartCall: (type: 'audio' | 'video') => void;
  isConnected: boolean;
  deviceType: 'pc' | 'phone';
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
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
  deviceType,
}) => {
  const t = translations[lang];
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<any>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const typingTimeoutRef = useRef<any>(null);

  // Auto-scroll on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeTransfer, isPeerTyping]);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    onTyping(true);

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      onTyping(false);
    }, 1200);
  };

  const handleSend = () => {
    if (!inputText.trim() || !isConnected) return;
    onSendMessage(inputText.trim());
    setInputText('');
    onTyping(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && isConnected) {
      onSendFile(file);
    }
    // reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Drag and drop file handling
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!isConnected) return;
    const file = e.dataTransfer.files?.[0];
    if (file) {
      onSendFile(file);
    }
  };

  // Audio Note Recording
  const startRecording = async () => {
    if (!isConnected) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          onSendAudioNote(base64, recordSeconds || 1);
        };
        reader.readAsDataURL(blob);
        clearInterval(recordTimerRef.current);
        setRecordSeconds(0);
        setIsRecording(false);
      };

      recorder.start(100);
      setIsRecording(true);
      setRecordSeconds(0);

      recordTimerRef.current = setInterval(() => {
        setRecordSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.warn('Microphone permission denied or unavailable:', err);
      // Fallback synthetic voice note simulation for testing
      simulateAudioNote();
    }
  };

  const simulateAudioNote = () => {
    setIsRecording(true);
    setRecordSeconds(0);
    recordTimerRef.current = setInterval(() => {
      setRecordSeconds((p) => p + 1);
    }, 1000);

    setTimeout(() => {
      clearInterval(recordTimerRef.current);
      setIsRecording(false);
      // Create lightweight silent audio data url
      onSendAudioNote('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=', 3);
    }, 2500);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    } else {
      setIsRecording(false);
      clearInterval(recordTimerRef.current);
    }
  };

  const playAudio = (id: string, audioUrl?: string) => {
    if (!audioUrl) return;
    if (playingAudioId === id) {
      audioPlayerRef.current?.pause();
      setPlayingAudioId(null);
      return;
    }

    if (audioPlayerRef.current) {
      audioPlayerRef.current.src = audioUrl;
      audioPlayerRef.current.play().catch(() => {});
      setPlayingAudioId(id);
      audioPlayerRef.current.onended = () => {
        setPlayingAudioId(null);
      };
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className="flex-1 flex flex-col h-full bg-slate-900/60 overflow-hidden relative select-text"
    >
      <audio ref={audioPlayerRef} className="hidden" />
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Chat Sub-Header */}
      <div className="px-4 py-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-500 flex items-center justify-center text-white font-bold text-sm shadow-md">
              {peerName.slice(0, 2).toUpperCase()}
            </div>
            {isConnected && (
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-slate-900 rounded-full" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white">{peerName}</h2>
              <span className="text-[10px] text-sky-400 font-mono bg-sky-500/10 border border-sky-500/20 px-1.5 py-0.5 rounded">
                Direct P2P
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              {isConnected ? (
                <span className="text-emerald-400 font-medium">متصل فالشبكة المحلية (LAN)</span>
              ) : (
                <span>في انتظار الاتصال المباشر...</span>
              )}
            </p>
          </div>
        </div>

        {/* Call Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onStartCall('audio')}
            disabled={!isConnected}
            title={t.callVoice}
            className={`p-2 rounded-xl transition-all ${
              isConnected
                ? 'bg-slate-800 hover:bg-sky-600/30 text-sky-400 hover:text-white border border-slate-700/80 shadow-sm'
                : 'bg-slate-800/40 text-slate-600 cursor-not-allowed'
            }`}
          >
            <Phone className="w-4 h-4" />
          </button>
          <button
            onClick={() => onStartCall('video')}
            disabled={!isConnected}
            title={t.callVideo}
            className={`p-2 rounded-xl transition-all ${
              isConnected
                ? 'bg-slate-800 hover:bg-sky-600/30 text-sky-400 hover:text-white border border-slate-700/80 shadow-sm'
                : 'bg-slate-800/40 text-slate-600 cursor-not-allowed'
            }`}
          >
            <Video className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
        {/* Welcome / Skype info card */}
        <div className="mx-auto max-w-md p-3.5 bg-slate-950/70 border border-slate-800/80 rounded-2xl text-center space-y-1.5">
          <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-sky-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>{t.directP2PBadge}</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            {t.noServerRelay}
          </p>
          <div className="text-[10px] text-slate-500 font-mono">
            RTCPeerConnection • RTCDataChannel • Host ICE Candidates
          </div>
        </div>

        {/* Message Items */}
        {messages.map((msg) => {
          const isMe = msg.sender === 'me';
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} animate-fade-in`}
            >
              <div className="flex items-end gap-2 max-w-[85%] sm:max-w-[70%]">
                {!isMe && (
                  <div className="w-7 h-7 rounded-full bg-slate-800 text-sky-400 font-semibold text-xs flex items-center justify-center border border-slate-700">
                    {msg.senderName.slice(0, 1)}
                  </div>
                )}

                <div
                  className={`p-3 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-md ${
                    isMe
                      ? 'bg-gradient-to-r from-sky-600 to-sky-700 text-white rounded-br-sm'
                      : 'bg-slate-800/90 text-slate-100 rounded-bl-sm border border-slate-700/80'
                  }`}
                >
                  {/* Text Message */}
                  {msg.type === 'text' && <p className="whitespace-pre-wrap break-words">{msg.text}</p>}

                  {/* Audio Voice Note */}
                  {msg.type === 'voice' && (
                    <div className="flex items-center gap-3 min-w-[180px]">
                      <button
                        onClick={() => playAudio(msg.id, msg.audioUrl)}
                        className={`p-2 rounded-full transition-transform active:scale-95 ${
                          isMe ? 'bg-sky-800 text-white' : 'bg-sky-500/20 text-sky-400'
                        }`}
                      >
                        {playingAudioId === msg.id ? (
                          <Pause className="w-4 h-4" />
                        ) : (
                          <Play className="w-4 h-4 fill-current" />
                        )}
                      </button>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-1 h-4">
                          {[40, 75, 30, 90, 60, 45, 80, 50, 70, 35].map((h, i) => (
                            <span
                              key={i}
                              style={{ height: `${h}%` }}
                              className={`w-1 rounded-full ${
                                playingAudioId === msg.id
                                  ? 'bg-cyan-300 animate-pulse'
                                  : isMe
                                  ? 'bg-sky-300'
                                  : 'bg-slate-400'
                              }`}
                            />
                          ))}
                        </div>
                        <div className="text-[10px] opacity-80 flex justify-between font-mono">
                          <span>تسجيل صوتي (أوديو)</span>
                          <span>{formatDuration(msg.audioDuration || 0)}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* File Transfer Message */}
                  {msg.type === 'file' && msg.fileInfo && (
                    <div className="flex items-center gap-3 min-w-[200px]">
                      <div className="p-2.5 bg-slate-950/40 rounded-xl text-sky-400">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <p className="font-semibold text-xs truncate">{msg.fileInfo.name}</p>
                        <p className="text-[10px] opacity-75">{formatBytes(msg.fileInfo.size)}</p>
                      </div>
                      {msg.fileInfo.blobUrl && (
                        <a
                          href={msg.fileInfo.blobUrl}
                          download={msg.fileInfo.name}
                          className="p-2 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 rounded-lg transition-colors"
                          title={t.download}
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  )}

                  {/* Meta / Timestamp */}
                  <div
                    className={`flex items-center gap-1.5 mt-1 text-[10px] ${
                      isMe ? 'text-sky-200 justify-end' : 'text-slate-400 justify-start'
                    }`}
                  >
                    <span>
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    {isMe && <CheckCheck className="w-3.5 h-3.5 text-cyan-300" />}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Live File Transfer Progress Card */}
        {activeTransfer && (
          <div className="mx-auto max-w-md p-3.5 bg-slate-950/90 border border-sky-500/40 rounded-2xl shadow-xl space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-sky-400 flex items-center gap-1.5">
                <FileText className="w-4 h-4" />
                <span>{activeTransfer.isReceiving ? 'استقبال ملف مباشر...' : 'إرسال ملف مباشر...'}</span>
              </span>
              <span className="font-mono text-cyan-300 font-bold">{activeTransfer.progress}%</span>
            </div>

            <p className="text-xs text-slate-200 font-medium truncate">{activeTransfer.fileName}</p>

            {/* Progress Bar */}
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-sky-500 to-cyan-400 h-full rounded-full transition-all duration-150"
                style={{ width: `${activeTransfer.progress}%` }}
              />
            </div>

            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>
                {formatBytes(activeTransfer.bytesTransferred)} / {formatBytes(activeTransfer.totalBytes)}
              </span>
              <span>{formatBytes(activeTransfer.speedBps)}/s</span>
            </div>
          </div>
        )}

        {/* Peer Typing Status */}
        {isPeerTyping && (
          <div className="flex items-center gap-2 text-xs text-sky-400 animate-fade-in pl-2">
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span>{peerName} يكتب الآن...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Recording Overlay Bar */}
      {isRecording && (
        <div className="px-4 py-2.5 bg-rose-950/80 border-t border-rose-800 flex items-center justify-between text-xs text-rose-300 animate-fade-in">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
            <span className="font-medium">{t.recording}</span>
            <span className="font-mono font-bold text-white bg-rose-900/60 px-2 py-0.5 rounded">
              {formatDuration(recordSeconds)}
            </span>
          </div>
          <button
            onClick={stopRecording}
            className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
            <span>{t.stopRecording}</span>
          </button>
        </div>
      )}

      {/* Input Form */}
      <div className="p-3 bg-slate-900/90 border-t border-slate-800">
        <div className="flex items-center gap-2 max-w-4xl mx-auto">
          {/* File Upload Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={!isConnected}
            title={t.sendFile}
            className={`p-2.5 rounded-xl transition-colors ${
              isConnected
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-sky-400 border border-slate-700/80'
                : 'bg-slate-800/40 text-slate-600 cursor-not-allowed'
            }`}
          >
            <Paperclip className="w-4 h-4" />
          </button>

          {/* Voice Record Button */}
          <button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={!isConnected}
            title={isRecording ? t.stopRecording : t.recordAudio}
            className={`p-2.5 rounded-xl transition-all ${
              isRecording
                ? 'bg-rose-600 text-white animate-pulse'
                : isConnected
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-sky-400 border border-slate-700/80'
                : 'bg-slate-800/40 text-slate-600 cursor-not-allowed'
            }`}
          >
            <Mic className="w-4 h-4" />
          </button>

          {/* Message Input */}
          <div className="flex-1 relative">
            <input
              type="text"
              value={inputText}
              onChange={handleTextChange}
              onKeyDown={handleKeyDown}
              disabled={!isConnected}
              placeholder={isConnected ? t.typeMessage : 'اتصل بالغرفة أولاً لإرسال الرسائل...'}
              className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={!isConnected || !inputText.trim()}
            title={t.send}
            className={`p-2.5 rounded-xl transition-all ${
              isConnected && inputText.trim()
                ? 'bg-gradient-to-r from-sky-600 to-cyan-500 hover:from-sky-500 hover:to-cyan-400 text-white shadow-md shadow-sky-600/30'
                : 'bg-slate-800/50 text-slate-600 cursor-not-allowed'
            }`}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
