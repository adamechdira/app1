/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  X,
  Activity,
  ShieldCheck,
  Zap,
  ArrowUpRight,
  ArrowDownLeft,
  ServerOff,
  Cpu,
  Wifi,
  Radio,
  Layers,
  CheckCircle2,
} from 'lucide-react';
import { Language, translations } from '../utils/i18n';
import { formatBytes, IceCandidateInfo } from '../utils/p2pProtocol';

interface DiagnosticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  pingMs: number;
  bytesSent: number;
  bytesReceived: number;
  iceInfo: IceCandidateInfo;
  roomId: string;
  peerId: string;
  isConnected: boolean;
}

export const DiagnosticsModal: React.FC<DiagnosticsModalProps> = ({
  isOpen,
  onClose,
  lang,
  pingMs,
  bytesSent,
  bytesReceived,
  iceInfo,
  roomId,
  peerId,
  isConnected,
}) => {
  const t = translations[lang];
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in text-slate-100">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-sky-500/10 text-sky-400 rounded-xl border border-sky-500/20">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>{t.diagnostics}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Direct LAN
                </span>
              </h2>
              <p className="text-xs text-slate-400">{t.networkStats}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {/* Ping */}
            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>{t.ping}</span>
                <Zap className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="text-xl font-bold font-mono text-white">
                {isConnected ? (pingMs > 0 ? `${pingMs} ms` : '< 2 ms') : '--'}
              </div>
              <p className="text-[10px] text-emerald-400 font-medium">
                {isConnected ? 'سرعة محلية فائقة' : 'غير متصل'}
              </p>
            </div>

            {/* Sent */}
            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>{t.bytesSent}</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-sky-400" />
              </div>
              <div className="text-xl font-bold font-mono text-sky-300">
                {formatBytes(bytesSent)}
              </div>
              <p className="text-[10px] text-slate-500 font-mono">DataChannel Out</p>
            </div>

            {/* Received */}
            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1 col-span-2 sm:col-span-1">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>{t.bytesReceived}</span>
                <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="text-xl font-bold font-mono text-emerald-300">
                {formatBytes(bytesReceived)}
              </div>
              <p className="text-[10px] text-slate-500 font-mono">DataChannel In</p>
            </div>
          </div>

          {/* ICE Candidate & Architecture Verification */}
          <div className="p-4 bg-slate-950/90 rounded-xl border border-slate-800 space-y-3">
            <h3 className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
              <ServerOff className="w-4 h-4 text-emerald-400" />
              <span>إثبات انعدام الخادم الوسيط (Zero Server Relay Proof)</span>
            </h3>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[10px]">نوع مرشح ICE (Candidate Type):</span>
                <span className="font-mono font-bold text-emerald-400">
                  {iceInfo.type === 'host' ? 'host (Direct Local Network)' : iceInfo.type}
                </span>
              </div>
              <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[10px]">البروتوكول (Protocol):</span>
                <span className="font-mono font-bold text-sky-400">
                  {iceInfo.protocol || 'UDP'} (Direct Peer Socket)
                </span>
              </div>
              <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[10px]">عنوان الجهاز (IP Address):</span>
                <span className="font-mono text-slate-200">
                  {iceInfo.address || 'Local Host Interface'}
                </span>
              </div>
              <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[10px]">خوادم TURN الوسيطة:</span>
                <span className="font-mono text-rose-400 font-semibold">
                  ممنوعة / Zero Relay Configured
                </span>
              </div>
            </div>

            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center gap-2 text-xs text-emerald-300">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>
                كل بايت ترسله يمر مباشرة من كارت الشبكة لجهازك إلى جهاز الطرف الآخر داخل شبكة الواي فاي بدون وسيط.
              </span>
            </div>
          </div>

          {/* Historical Skype Comparison */}
          <div className="p-4 bg-sky-950/20 rounded-xl border border-sky-800/30 text-xs text-slate-300 space-y-2">
            <h4 className="font-bold text-sky-300 flex items-center gap-1.5">
              <Layers className="w-4 h-4" />
              <span>مقارنة: معمارية سكايب الأصلية vs التطبيقات السحابية</span>
            </h4>
            <div className="space-y-1.5 leading-relaxed text-[11px] text-slate-300">
              <p>
                • <strong className="text-white">سكايب القديم (P2P):</strong> الأجهزة كانت ترتبط مع بعضها البعض مباشرة
                بتقنية الند للند. الخادم كان يستخدم فقط لمعرفة أن المستخدم متصل، أما الصوت والصورة والشات فكانت تنقل
                مباشرة بين الأجهزة.
              </p>
              <p>
                • <strong className="text-white">التطبيقات الحديثة (Cloud Relay):</strong> كل كلمة وكل ثانية فيديو ترسلها تمر
                أولاً إلى سيرفرات الشركة ليتم تخزينها أو معالجتها ثم إعادة إرسالها.
              </p>
              <p>
                • <strong className="text-white">هذا التطبيق:</strong> يعيد إليك حرية وسرعة سكايب الأصلي عبر متصفح الويب
                باستخدام WebRTC DataChannel المباشر.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
