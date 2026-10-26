import React, { useEffect } from 'react';
import { Volume2 } from 'lucide-react';

interface AndroidSplashScreenProps {
  onFinishSplash: () => void;
}

export const AndroidSplashScreen: React.FC<AndroidSplashScreenProps> = ({ onFinishSplash }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onFinishSplash();
    }, 1600);

    return () => clearTimeout(timer);
  }, [onFinishSplash]);

  return (
    <div className="w-full h-full min-h-[720px] bg-[#09090b] flex flex-col items-center justify-between py-16 px-6 text-white font-sans select-none relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-purple-600/25 blur-[100px] rounded-full pointer-events-none"></div>

      <div className="my-auto flex flex-col items-center text-center z-10 animate-in fade-in zoom-in-95 duration-500">
        {/* Animated App Icon */}
        <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 border-2 border-purple-400/50 shadow-[0_0_40px_rgba(124,58,237,0.5)] flex flex-col items-center justify-center mb-6 relative">
          <span className="text-4xl font-black text-white leading-none">₹</span>
          <Volume2 className="w-6 h-6 text-purple-200 mt-1 animate-pulse" />
        </div>

        <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">
          Loudbox
        </h1>
        <p className="text-xs text-purple-300 font-medium tracking-wide">
          All-in-One Mobile UPI Loudbox
        </p>
      </div>

      {/* Footer Branding */}
      <div className="flex flex-col items-center gap-2 z-10">
        {/* Loading Spinner */}
        <div className="w-5 h-5 rounded-full border-2 border-purple-500/30 border-t-purple-400 animate-spin mb-3"></div>
        <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">
          Loudbox by Propel
        </span>
        <span className="text-[9px] text-slate-600 font-mono">
          v4.8
        </span>
      </div>
    </div>
  );
};
