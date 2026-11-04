/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Wifi,
  QrCode,
  Copy,
  Check,
  Radio,
  FileCode2,
  Info,
  Laptop,
  Smartphone,
  ArrowRight,
  ShieldAlert,
  Zap,
} from 'lucide-react';
import QRCode from 'qrcode';
import { Language, translations } from '../utils/i18n';
import { generateRoomCode } from '../utils/p2pProtocol';

interface ConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  currentRoom: string;
  onJoinRoom: (roomId: string, isInitiator?: boolean) => void;
  onManualOfferCreate: () => Promise<string>;
  onManualOfferAccept: (offer: string) => Promise<string>;
  onManualAnswerAccept: (answer: string) => Promise<void>;
  deviceType: 'pc' | 'phone';
}

export const ConnectionModal: React.FC<ConnectionModalProps> = ({
  isOpen,
  onClose,
  lang,
  currentRoom,
  onJoinRoom,
  onManualOfferCreate,
  onManualOfferAccept,
  onManualAnswerAccept,
  deviceType,
}) => {
  const t = translations[lang];
  const [tab, setTab] = useState<'quick' | 'qr' | 'manual' | 'skype'>('quick');
  const [roomIdInput, setRoomIdInput] = useState(currentRoom || generateRoomCode());
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  // Manual SDP states
  const [myOffer, setMyOffer] = useState('');
  const [peerOffer, setPeerOffer] = useState('');
  const [myAnswer, setMyAnswer] = useState('');
  const [peerAnswer, setPeerAnswer] = useState('');
  const [manualStep, setManualStep] = useState<1 | 2>(1);
  const [isGeneratingSdp, setIsGeneratingSdp] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (!roomIdInput) {
        setRoomIdInput(currentRoom || generateRoomCode());
      }
      generateQr();
    }
  }, [isOpen, roomIdInput]);

  const generateQr = async () => {
    try {
      const room = roomIdInput || 'LAN-1001';
      const shareUrl = `${window.location.origin}${window.location.pathname}?room=${room}`;
      const url = await QRCode.toDataURL(shareUrl, {
        width: 260,
        margin: 2,
        color: {
          dark: '#0284c7',
          light: '#0f172a',
        },
      });
      setQrDataUrl(url);
    } catch (err) {
      console.error('QR code generation error:', err);
    }
  };

  if (!isOpen) return null;

  const handleCopyLink = () => {
    const room = roomIdInput || 'LAN-1001';
    const shareUrl = `${window.location.origin}${window.location.pathname}?room=${room}`;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyRoom = () => {
    navigator.clipboard.writeText(roomIdInput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleQuickConnect = () => {
    if (!roomIdInput.trim()) return;
    onJoinRoom(roomIdInput.trim(), true);
    onClose();
  };

  const handleStartManualAsOffer = async () => {
    setIsGeneratingSdp(true);
    try {
      const offerStr = await onManualOfferCreate();
      setMyOffer(offerStr);
    } finally {
      setIsGeneratingSdp(false);
    }
  };

  const handleAcceptPeerOffer = async () => {
    if (!peerOffer.trim()) return;
    setIsGeneratingSdp(true);
    try {
      const answerStr = await onManualOfferAccept(peerOffer.trim());
      setMyAnswer(answerStr);
    } finally {
      setIsGeneratingSdp(false);
    }
  };

  const handleFinalizeAnswer = async () => {
    if (!peerAnswer.trim()) return;
    setIsGeneratingSdp(true);
    try {
      await onManualAnswerAccept(peerAnswer.trim());
      onClose();
    } finally {
      setIsGeneratingSdp(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-100">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-sky-500/10 text-sky-400 rounded-xl border border-sky-500/20">
              <Wifi className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>{t.joinRoom}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  P2P Direct
                </span>
              </h2>
              <p className="text-xs text-slate-400">{t.noServerRelay}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-6 pt-2 gap-2 text-xs font-medium">
          <button
            onClick={() => setTab('quick')}
            className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
              tab === 'quick'
                ? 'border-sky-500 text-sky-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>كود الغرفة (Room Code)</span>
          </button>
          <button
            onClick={() => setTab('qr')}
            className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
              tab === 'qr'
                ? 'border-sky-500 text-sky-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>QR Code للتيليفون</span>
          </button>
          <button
            onClick={() => setTab('manual')}
            className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
              tab === 'manual'
                ? 'border-sky-500 text-sky-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCode2 className="w-3.5 h-3.5" />
            <span>يدوي (SDP)</span>
          </button>
          <button
            onClick={() => setTab('skype')}
            className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
              tab === 'skype'
                ? 'border-sky-500 text-sky-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            <span>معمارية سكايب</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto max-h-[75vh]">
          {tab === 'quick' && (
            <div className="space-y-4">
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 space-y-3">
                <label className="block text-xs font-medium text-slate-300">
                  {t.roomCode} (LAN Room):
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={roomIdInput}
                    onChange={(e) => setRoomIdInput(e.target.value.toUpperCase())}
                    placeholder="e.g. LAN-8492"
                    className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sky-300 font-mono text-sm tracking-wider focus:outline-none focus:border-sky-500"
                  />
                  <button
                    onClick={() => setRoomIdInput(generateRoomCode())}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition-colors"
                    title="Generate new code"
                  >
                    جديد ↻
                  </button>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={handleCopyRoom}
                    className="flex-1 py-1.5 px-3 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 text-slate-300 rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? t.codeCopied : t.copyCode}</span>
                  </button>

                  <button
                    onClick={handleCopyLink}
                    className="flex-1 py-1.5 px-3 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 text-slate-300 rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <span>نسخ رابط الاتصال المباشر</span>
                  </button>
                </div>
              </div>

              {/* Instructions */}
              <div className="p-3.5 bg-sky-950/20 border border-sky-800/30 rounded-xl text-xs space-y-2 text-sky-200">
                <div className="flex items-center gap-1.5 font-semibold text-sky-400">
                  <Radio className="w-4 h-4" />
                  <span>طريقة الربط بين البيسي والتيليفون:</span>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-slate-300 leading-relaxed">
                  <li>فتح هاد التطبيق فالبيسي وتيستيه فنفس الويفي (LAN).</li>
                  <li>كتب نفس كود الغرفة <span className="font-mono text-sky-300 font-bold">({roomIdInput})</span> فالتيليفون أو سكاني الـ QR Code.</li>
                  <li>غايتكونيكطاو فالبلاصة P2P ديريكت بدون وسيط وبدون مرور البيانات على سيرفر خارجي!</li>
                </ol>
              </div>

              <button
                onClick={handleQuickConnect}
                className="w-full py-3 bg-gradient-to-r from-sky-600 via-sky-500 to-cyan-500 hover:from-sky-500 hover:to-cyan-400 text-white font-bold rounded-xl text-sm shadow-lg shadow-sky-600/25 transition-all flex items-center justify-center gap-2"
              >
                <Zap className="w-4 h-4" />
                <span>اتصال مباشر الآن (Connect P2P)</span>
              </button>
            </div>
          )}

          {tab === 'qr' && (
            <div className="flex flex-col items-center text-center space-y-4">
              <p className="text-xs text-slate-300 max-w-xs">
                سكاني هاد الكود بكاميرا التيليفون ديالك باش يفتح التطبيق مباشرة ويتصل مع البيسي عبر الويفي المحلي:
              </p>

              {qrDataUrl ? (
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl shadow-xl">
                  <img
                    src={qrDataUrl}
                    alt="Quick Connect QR Code"
                    className="w-56 h-56 rounded-lg object-contain"
                  />
                  <div className="mt-2 text-[11px] font-mono text-sky-400">
                    Room: {roomIdInput}
                  </div>
                </div>
              ) : (
                <div className="w-56 h-56 bg-slate-950 rounded-2xl flex items-center justify-center text-slate-500 text-xs">
                  جاري تحضير رمز QR...
                </div>
              )}

              <div className="flex items-center gap-3">
                <button
                  onClick={handleCopyLink}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium border border-slate-700 transition-colors flex items-center gap-1.5"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? t.codeCopied : 'نسخ رابط التيليفون'}</span>
                </button>
                <button
                  onClick={handleQuickConnect}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-semibold transition-colors"
                >
                  دخول للغرفة
                </button>
              </div>
            </div>
          )}

          {tab === 'manual' && (
            <div className="space-y-4 text-xs">
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  هاد النمط مخصص للحالات لي مافيهاش حتى سيرفر للإشارة نهائياً (Air-Gapped). يمكنك نسخ الـ SDP ولصقه مباشرة.
                </span>
              </div>

              {/* Step 1: Offer */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-sky-400">1. الجهاز الأول (ينشئ Offer):</span>
                  <button
                    onClick={handleStartManualAsOffer}
                    disabled={isGeneratingSdp}
                    className="px-2.5 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded text-[11px]"
                  >
                    {isGeneratingSdp ? 'جاري التوليد...' : 'توليد Offer'}
                  </button>
                </div>
                {myOffer && (
                  <div className="relative">
                    <textarea
                      readOnly
                      value={myOffer}
                      rows={3}
                      className="w-full p-2 bg-slate-950 font-mono text-[10px] text-slate-300 rounded-lg border border-slate-800"
                    />
                    <button
                      onClick={() => navigator.clipboard.writeText(myOffer)}
                      className="absolute top-2 right-2 px-2 py-0.5 bg-slate-800 text-xs rounded text-slate-300"
                    >
                      نسخ
                    </button>
                  </div>
                )}
              </div>

              {/* Step 2: Peer Offer / Answer */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <span className="font-semibold text-emerald-400">2. الجهاز الثاني (يلصق الـ Offer ويرد بـ Answer):</span>
                <textarea
                  value={peerOffer}
                  onChange={(e) => setPeerOffer(e.target.value)}
                  placeholder="ألصق الـ Offer هنا..."
                  rows={2}
                  className="w-full p-2 bg-slate-950 font-mono text-[10px] text-slate-300 rounded-lg border border-slate-800"
                />
                <button
                  onClick={handleAcceptPeerOffer}
                  disabled={!peerOffer.trim() || isGeneratingSdp}
                  className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold"
                >
                  توليد Answer
                </button>
                {myAnswer && (
                  <div className="relative">
                    <textarea
                      readOnly
                      value={myAnswer}
                      rows={2}
                      className="w-full p-2 bg-slate-950 font-mono text-[10px] text-slate-300 rounded-lg border border-slate-800"
                    />
                    <button
                      onClick={() => navigator.clipboard.writeText(myAnswer)}
                      className="absolute top-2 right-2 px-2 py-0.5 bg-slate-800 text-xs rounded text-slate-300"
                    >
                      نسخ
                    </button>
                  </div>
                )}
              </div>

              {/* Step 3: Finalize on Device 1 */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <span className="font-semibold text-purple-400">3. الجهاز الأول يلصق الـ Answer لإتمام الاتصال:</span>
                <textarea
                  value={peerAnswer}
                  onChange={(e) => setPeerAnswer(e.target.value)}
                  placeholder="ألصق الـ Answer هنا..."
                  rows={2}
                  className="w-full p-2 bg-slate-950 font-mono text-[10px] text-slate-300 rounded-lg border border-slate-800"
                />
                <button
                  onClick={handleFinalizeAnswer}
                  disabled={!peerAnswer.trim() || isGeneratingSdp}
                  className="w-full py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded text-xs font-semibold"
                >
                  إتمام الاتصال المباشر P2P
                </button>
              </div>
            </div>
          )}

          {tab === 'skype' && (
            <div className="space-y-3 text-xs leading-relaxed text-slate-300">
              <div className="p-3 bg-sky-950/40 border border-sky-800/40 rounded-xl space-y-2">
                <h3 className="font-bold text-sky-400 text-sm flex items-center gap-1.5">
                  <span>💡 كيفاش كان كيخدم سكايب الأصلي (P2P Mesh)؟</span>
                </h3>
                <p>
                  فالفترة ما بين 2003 و 2013 قبل ما تشتريه ميكروسوفت وتبدلو لسيرفرات سحابية، سكايب ما كانش عندو خوادم وسيطة
                  كتحول المكالمات أو الشات. كان كيعتمد على بروتوكول الند للند (Peer-to-Peer):
                </p>
                <ul className="list-disc list-inside space-y-1 text-slate-300">
                  <li>
                    <strong className="text-white">الاتصال المباشر (Direct Socket):</strong> البيانات (صوت، فيديو، ملفات)
                    كتمر مباشرة من جهاز أ للجهاز ب بدون وسيط.
                  </li>
                  <li>
                    <strong className="text-white">السرية التامة:</strong> حتى واحد ما يقدر يسجل أو يتجسس على حركة البيانات
                    فالوسط حيت مكاينش خادم وسيط كيدوز منو المحتوى.
                  </li>
                  <li>
                    <strong className="text-white">السرعة القصوى فالشبكة المحلية (LAN):</strong> إذا كانو جوج أجهزة فنفس
                    الراوتر، البيانات مكتخرجش كاع للإنترنت الخارجي، كتبقى ديريكت فالمجال المحلي بسرعة الويفي الكاملة!
                  </li>
                </ul>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-slate-400">
                <div className="flex items-center gap-2">
                  <Laptop className="w-5 h-5 text-sky-400" />
                  <span>البيسي ديالك</span>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-mono">
                  <span>◀── DataChannel (Direct LAN) ──▶</span>
                </div>
                <div className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-sky-400" />
                  <span>التيليفون ديالك</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
