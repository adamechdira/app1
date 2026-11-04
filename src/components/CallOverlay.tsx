/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  PhoneCall,
  PhoneForwarded,
  Maximize2,
  Minimize2,
  MonitorUp,
  RefreshCw,
  Radio,
  ShieldCheck,
  Volume2,
} from 'lucide-react';
import { Language, translations } from '../utils/i18n';
import { formatDuration } from '../utils/p2pProtocol';

interface CallOverlayProps {
  lang: Language;
  isInCall: boolean;
  isIncoming: boolean;
  callType: 'audio' | 'video' | null;
  callerName?: string;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  pingMs: number;
  onAcceptCall: () => void;
  onDeclineCall: () => void;
  onEndCall: () => void;
  onToggleMute: (muted: boolean) => void;
  onToggleCamera: (enabled: boolean) => void;
  deviceType: 'pc' | 'phone';
}

export const CallOverlay: React.FC<CallOverlayProps> = ({
  lang,
  isInCall,
  isIncoming,
  callType,
  callerName,
  localStream,
  remoteStream,
  pingMs,
  onAcceptCall,
  onDeclineCall,
  onEndCall,
  onToggleMute,
  onToggleCamera,
  deviceType,
}) => {
  const t = translations[lang];
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<any>(null);

  // Hook streams to video elements
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, isInCall, isMinimized]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, isInCall, isMinimized]);

  // Call duration counter
  useEffect(() => {
    if (isInCall) {
      setCallDuration(0);
      timerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
      setCallDuration(0);
    }
    return () => clearInterval(timerRef.current);
  }, [isInCall]);

  const handleMuteToggle = () => {
    const next = !isMuted;
    setIsMuted(next);
    onToggleMute(next);
  };

  const handleCameraToggle = () => {
    const next = !isVideoOff;
    setIsVideoOff(next);
    onToggleCamera(!next);
  };

  // Incoming Call Prompt
  if (isIncoming) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
        <div className="relative w-full max-w-sm bg-slate-900 border border-sky-500/40 rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center space-y-6">
          {/* Animated rings */}
          <div className="relative flex items-center justify-center w-24 h-24">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-25"></span>
            <span className="animate-pulse absolute inline-flex h-20 w-20 rounded-full bg-sky-500/40"></span>
            <div className="relative w-16 h-16 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
              {callType === 'video' ? <Video className="w-8 h-8" /> : <PhoneCall className="w-8 h-8" />}
            </div>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400 bg-sky-500/10 px-2.5 py-0.5 rounded-full border border-sky-500/30">
              {callType === 'video' ? t.callVideo : t.callVoice} • P2P LAN
            </span>
            <h3 className="text-lg font-bold text-white mt-2">{callerName || 'الجهاز الآخر'}</h3>
            <p className="text-xs text-slate-400 mt-1">{t.incomingCall}</p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-6 w-full justify-center pt-2">
            <button
              onClick={onDeclineCall}
              className="flex flex-col items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 transition-colors"
            >
              <div className="w-14 h-14 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-600/30 transition-transform active:scale-95">
                <PhoneOff className="w-6 h-6" />
              </div>
              <span className="font-semibold">{t.decline}</span>
            </button>

            <button
              onClick={onAcceptCall}
              className="flex flex-col items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              <div className="w-14 h-14 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30 transition-transform active:scale-95 animate-bounce">
                <PhoneCall className="w-6 h-6" />
              </div>
              <span className="font-semibold">{t.accept}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!isInCall) return null;

  // Minimized Call Floating Bar
  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50 bg-slate-900 border border-sky-500/40 rounded-2xl p-3 shadow-2xl flex items-center gap-3 animate-fade-in text-white">
        <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
        <div className="text-xs">
          <p className="font-bold text-sky-400">{callType === 'video' ? 'مكالمة فيديو' : 'مكالمة صوتية'}</p>
          <p className="text-[10px] text-slate-400 font-mono">{formatDuration(callDuration)}</p>
        </div>
        <button
          onClick={() => setIsMinimized(false)}
          className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-300"
          title="Maximize"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
        <button
          onClick={onEndCall}
          className="p-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg"
          title={t.endCall}
        >
          <PhoneOff className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // Full Call View
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/90 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-4xl h-[85vh] bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Call Top Bar */}
        <div className="absolute top-0 inset-x-0 z-30 p-4 flex items-center justify-between bg-gradient-to-b from-slate-950/80 to-transparent">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 px-3 py-1 rounded-full text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{t.inCall}</span>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-900/80 border border-slate-700 px-2.5 py-1 rounded-full text-xs font-mono text-sky-300">
              <Radio className="w-3 h-3 text-sky-400 animate-pulse" />
              <span>{pingMs > 0 ? `${pingMs}ms LAN Direct` : 'Direct P2P'}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-bold text-white bg-slate-900/80 px-3 py-1 rounded-full border border-slate-700">
              {formatDuration(callDuration)}
            </span>
            <button
              onClick={() => setIsMinimized(true)}
              className="p-2 bg-slate-900/80 hover:bg-slate-800 text-slate-300 rounded-full border border-slate-700"
              title="Minimize call"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Video / Audio Area */}
        <div className="relative flex-1 bg-slate-950 flex items-center justify-center overflow-hidden">
          {callType === 'video' ? (
            <>
              {/* Remote Video Feed */}
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />

              {/* Local Video PIP (Picture in Picture) */}
              <div className="absolute bottom-20 right-4 w-32 h-44 sm:w-48 sm:h-64 bg-slate-900 rounded-2xl overflow-hidden border-2 border-sky-500/60 shadow-2xl z-20">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${isVideoOff ? 'hidden' : 'block'}`}
                />
                {isVideoOff && (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 text-xs">
                    <VideoOff className="w-6 h-6 mb-1 text-slate-400" />
                    <span>الكاميرا مطفية</span>
                  </div>
                )}
                <div className="absolute bottom-2 left-2 text-[10px] font-semibold bg-slate-950/70 text-sky-300 px-2 py-0.5 rounded">
                  أنت (You)
                </div>
              </div>
            </>
          ) : (
            /* Audio Call Screen */
            <div className="flex flex-col items-center justify-center space-y-6 text-center p-6">
              <div className="relative flex items-center justify-center w-36 h-36">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-500/20"></span>
                <span className="animate-pulse absolute inline-flex h-28 w-28 rounded-full bg-sky-600/30"></span>
                <div className="relative w-24 h-24 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-xl">
                  <Volume2 className="w-10 h-10 animate-pulse" />
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold text-white">{callerName || 'المكالمة الصوتية المباشرة'}</h3>
                <p className="text-xs text-sky-400 mt-1">تشفير تام • بدون خادم وسيط • جودة صوت عالية</p>
              </div>

              {/* Live Audio Visualizer Bars */}
              <div className="flex items-center gap-1.5 h-10">
                {[30, 60, 90, 45, 80, 100, 75, 40, 85, 55, 95, 35, 70, 50, 80].map((h, i) => (
                  <span
                    key={i}
                    style={{
                      height: `${isMuted ? 10 : Math.max(15, (h * (Math.sin(callDuration + i) + 1.2)) / 2)}%`,
                    }}
                    className="w-1.5 bg-gradient-to-t from-sky-500 to-cyan-300 rounded-full transition-all duration-150"
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Control Dock */}
        <div className="p-4 bg-slate-950/90 border-t border-slate-800 flex items-center justify-center gap-3 sm:gap-4 z-30">
          {/* Mute Mic */}
          <button
            onClick={handleMuteToggle}
            className={`p-3.5 rounded-full transition-all ${
              isMuted
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 hover:bg-rose-500/30'
                : 'bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700'
            }`}
            title={isMuted ? t.unmuteMic : t.muteMic}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Camera On/Off (Video call only) */}
          {callType === 'video' && (
            <button
              onClick={handleCameraToggle}
              className={`p-3.5 rounded-full transition-all ${
                isVideoOff
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 hover:bg-rose-500/30'
                  : 'bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700'
              }`}
              title={isVideoOff ? t.camOn : t.camOff}
            >
              {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
            </button>
          )}

          {/* End Call */}
          <button
            onClick={onEndCall}
            className="p-3.5 px-6 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-bold transition-all shadow-lg shadow-rose-600/30 flex items-center gap-2 active:scale-95"
            title={t.endCall}
          >
            <PhoneOff className="w-5 h-5" />
            <span className="text-xs sm:text-sm">{t.endCall}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
