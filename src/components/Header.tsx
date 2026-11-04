/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Laptop,
  Smartphone,
  Columns,
  Wifi,
  ShieldCheck,
  Activity,
  Globe,
  Radio,
  QrCode,
  LogOut,
} from 'lucide-react';
import { Language, translations } from '../utils/i18n';
import { ConnectionState } from '../utils/webrtcManager';

interface HeaderProps {
  lang: Language;
  onLanguageChange: (lang: Language) => void;
  viewMode: 'pc' | 'phone' | 'split';
  onViewModeChange: (mode: 'pc' | 'phone' | 'split') => void;
  connectionState: ConnectionState;
  roomId: string;
  pingMs: number;
  onOpenConnectModal: () => void;
  onOpenDiagnostics: () => void;
  onDisconnect: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  lang,
  onLanguageChange,
  viewMode,
  onViewModeChange,
  connectionState,
  roomId,
  pingMs,
  onOpenConnectModal,
  onOpenDiagnostics,
  onDisconnect,
}) => {
  const t = translations[lang];

  const getStatusBadge = () => {
    switch (connectionState) {
      case 'connected':
        return (
          <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>{t.connected}</span>
            {pingMs > 0 && (
              <span className="text-[10px] bg-emerald-500/20 px-1.5 py-0.5 rounded text-emerald-300">
                {pingMs}ms
              </span>
            )}
          </div>
        );
      case 'connecting':
      case 'discovering':
        return (
          <div className="flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-full text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <span>{t.connecting}</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-2 px-3 py-1 bg-slate-800 border border-slate-700 text-slate-400 rounded-full text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-slate-500" />
            <span>{t.disconnected}</span>
          </div>
        );
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-white">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 via-sky-500 to-cyan-400 shadow-lg shadow-sky-500/20 text-white">
            <Radio className="w-5 h-5 animate-pulse" />
            <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-cyan-500 border-2 border-slate-900"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-base sm:text-lg tracking-tight text-white flex items-center gap-1.5">
                <span>{t.appName}</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-400 border border-sky-500/30">
                  LAN P2P
                </span>
              </h1>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block truncate max-w-sm">
              {t.appTagline}
            </p>
          </div>
        </div>

        {/* View Mode Switcher (PC / Phone / Split) */}
        <div className="flex items-center bg-slate-950/80 p-1 rounded-xl border border-slate-800 shadow-inner">
          <button
            data-testid="btn-view-pc"
            onClick={() => onViewModeChange('pc')}
            aria-label="PC View"
            title={t.pcVersion}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              viewMode === 'pc'
                ? 'bg-sky-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Laptop className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">PC</span>
          </button>

          <button
            data-testid="btn-view-phone"
            onClick={() => onViewModeChange('phone')}
            aria-label="Phone View"
            title={t.phoneVersion}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              viewMode === 'phone'
                ? 'bg-sky-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Phone</span>
          </button>

          <button
            data-testid="btn-view-split"
            onClick={() => onViewModeChange('split')}
            aria-label="Split Screen View"
            title={t.splitView}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              viewMode === 'split'
                ? 'bg-gradient-to-r from-sky-600 to-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Columns className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Split (PC + Phone)</span>
          </button>
        </div>

        {/* Status & Actions */}
        <div className="flex items-center gap-2">
          {/* Status Badge */}
          <button
            data-testid="btn-status-badge"
            onClick={onOpenDiagnostics}
            className="hidden sm:flex items-center gap-1.5 hover:opacity-85 transition-opacity"
            title={t.diagnostics}
          >
            {getStatusBadge()}
          </button>

          {/* Connect / Room Button */}
          {connectionState === 'connected' ? (
            <div className="flex items-center gap-1">
              <button
                data-testid="btn-room-info"
                onClick={onOpenConnectModal}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition-colors"
                title="Room Info / QR Code"
              >
                <QrCode className="w-3.5 h-3.5 text-sky-400" />
                <span className="font-mono text-sky-300 hidden sm:inline">{roomId}</span>
              </button>
              <button
                data-testid="btn-disconnect"
                onClick={onDisconnect}
                className="p-1.5 text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                title={t.disconnect}
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              data-testid="btn-join-room"
              onClick={onOpenConnectModal}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-500 hover:to-cyan-500 text-white font-medium rounded-lg text-xs shadow-md shadow-sky-600/20 transition-all"
            >
              <Wifi className="w-3.5 h-3.5" />
              <span>{t.joinRoom}</span>
            </button>
          )}

          {/* Diagnostics Button */}
          <button
            data-testid="btn-diagnostics"
            onClick={onOpenDiagnostics}
            className="p-1.5 text-slate-400 hover:text-sky-400 hover:bg-slate-800 rounded-lg transition-colors"
            title={t.diagnostics}
          >
            <Activity className="w-4 h-4" />
          </button>

          {/* Language Switcher */}
          <div className="relative group">
            <button
              className="flex items-center gap-1 px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs border border-slate-700 transition-colors"
              title="Change Language"
            >
              <Globe className="w-3.5 h-3.5 text-slate-400" />
              <span className="uppercase text-[11px] font-semibold">{lang}</span>
            </button>
            <div className="absolute right-0 mt-1 hidden group-hover:flex flex-col bg-slate-900 border border-slate-700 rounded-lg shadow-xl py-1 z-50 min-w-[120px]">
              <button
                onClick={() => onLanguageChange('darija')}
                className={`px-3 py-1.5 text-left text-xs hover:bg-slate-800 transition-colors ${
                  lang === 'darija' ? 'text-sky-400 font-semibold' : 'text-slate-300'
                }`}
              >
                🇲🇦 الدارجة المغربية
              </button>
              <button
                onClick={() => onLanguageChange('ar')}
                className={`px-3 py-1.5 text-left text-xs hover:bg-slate-800 transition-colors ${
                  lang === 'ar' ? 'text-sky-400 font-semibold' : 'text-slate-300'
                }`}
              >
                العربية الفصحى
              </button>
              <button
                onClick={() => onLanguageChange('en')}
                className={`px-3 py-1.5 text-left text-xs hover:bg-slate-800 transition-colors ${
                  lang === 'en' ? 'text-sky-400 font-semibold' : 'text-slate-300'
                }`}
              >
                English
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
