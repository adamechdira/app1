/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface PhoneFrameProps {
  children: React.ReactNode;
}

export const PhoneFrame: React.FC<PhoneFrameProps> = ({ children }) => {
  return (
    <div className="relative mx-auto w-[360px] sm:w-[380px] h-[720px] sm:h-[750px] bg-slate-950 rounded-[48px] p-3 shadow-2xl border-4 border-slate-700/80 ring-1 ring-slate-800 flex flex-col items-center">
      {/* Speaker Grill & Dynamic Island Notch */}
      <div className="absolute top-4 z-40 w-28 h-5 bg-black rounded-full flex items-center justify-between px-3">
        <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-800" />
        <div className="w-10 h-1.5 rounded-full bg-slate-900" />
        <div className="w-2.5 h-2.5 rounded-full bg-sky-950 border border-sky-800" />
      </div>

      {/* Screen Container */}
      <div className="w-full h-full bg-slate-950 rounded-[38px] overflow-hidden flex flex-col relative">
        {children}
      </div>

      {/* Bottom Home Indicator Bar */}
      <div className="absolute bottom-2 z-40 w-32 h-1 bg-slate-600/70 rounded-full" />
    </div>
  );
};
