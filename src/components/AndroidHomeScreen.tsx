import React from 'react';
import { 
  Search, 
  Mic, 
  Camera, 
  MessageCircle, 
  Phone, 
  Chrome, 
  ShoppingBag, 
  Volume2
} from 'lucide-react';

interface AndroidHomeScreenProps {
  onOpenLoudbox: () => void;
  isFirstLaunch: boolean;
}

export const AndroidHomeScreen: React.FC<AndroidHomeScreenProps> = ({
  onOpenLoudbox,
  isFirstLaunch,
}) => {
  const currentDate = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="relative w-full h-full min-h-[720px] bg-slate-950 p-6 flex flex-col justify-between select-none overflow-hidden text-white font-sans">
      {/* Top Section: Date & Clock Widget */}
      <div className="pt-6 flex flex-col items-start z-10">
        <div className="text-5xl font-light tracking-tight text-white/95 font-sans">
          {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
        </div>
        <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-400 font-medium">
          <span>{currentDate}</span>
          <span>·</span>
          <span>28°C Bengaluru</span>
        </div>

        {/* Minimal Google Search Bar */}
        <div className="w-full mt-6 bg-slate-900/90 border border-slate-800 rounded-full px-4 py-2.5 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2.5 text-xs text-slate-400">
            <span className="font-semibold text-slate-300">Google</span>
            <span className="text-slate-500">Search...</span>
          </div>
          <div className="flex items-center gap-3 text-slate-400">
            <Mic className="w-4 h-4" />
            <Camera className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* App Grid */}
      <div className="grid grid-cols-4 gap-y-7 gap-x-2 my-auto px-1 z-10">
        {/* Loudbox App Icon */}
        <button
          onClick={onOpenLoudbox}
          className="flex flex-col items-center gap-1.5 transition transform active:scale-95 cursor-pointer group"
        >
          <div className="w-14 h-14 rounded-2xl bg-purple-600 border border-purple-400/40 shadow-md flex items-center justify-center relative overflow-hidden">
            <div className="flex flex-col items-center justify-center text-white">
              <span className="text-xl font-bold leading-none">₹</span>
              <Volume2 className="w-3 h-3 text-purple-200 mt-0.5" />
            </div>

            {isFirstLaunch && (
              <div className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-slate-900" />
            )}
          </div>

          <span className="text-xs font-medium text-white tracking-tight text-center">
            Loudbox
          </span>
        </button>

        {/* GPay */}
        <div className="flex flex-col items-center gap-1.5 opacity-80">
          <div className="w-14 h-14 rounded-2xl bg-white text-blue-600 font-black text-xl flex items-center justify-center shadow-sm">
            G
          </div>
          <span className="text-xs font-medium text-slate-400">GPay</span>
        </div>

        {/* PhonePe */}
        <div className="flex flex-col items-center gap-1.5 opacity-80">
          <div className="w-14 h-14 rounded-2xl bg-[#5f259f] text-white font-bold text-sm flex items-center justify-center shadow-sm">
            पे
          </div>
          <span className="text-xs font-medium text-slate-400">PhonePe</span>
        </div>

        {/* Paytm */}
        <div className="flex flex-col items-center gap-1.5 opacity-80">
          <div className="w-14 h-14 rounded-2xl bg-[#00baF2] text-white font-bold text-xs flex items-center justify-center shadow-sm">
            Paytm
          </div>
          <span className="text-xs font-medium text-slate-400">Paytm</span>
        </div>

        {/* WhatsApp */}
        <div className="flex flex-col items-center gap-1.5 opacity-80">
          <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
            <MessageCircle className="w-6 h-6 fill-white" />
          </div>
          <span className="text-xs font-medium text-slate-400">WhatsApp</span>
        </div>

        {/* Chrome */}
        <div className="flex flex-col items-center gap-1.5 opacity-80">
          <div className="w-14 h-14 rounded-2xl bg-slate-850 border border-slate-700/60 text-amber-400 flex items-center justify-center shadow-sm">
            <Chrome className="w-6 h-6" />
          </div>
          <span className="text-xs font-medium text-slate-400">Chrome</span>
        </div>

        {/* Kirana POS */}
        <div className="flex flex-col items-center gap-1.5 opacity-80">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-sm">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <span className="text-xs font-medium text-slate-400">Billing</span>
        </div>

        {/* Camera */}
        <div className="flex flex-col items-center gap-1.5 opacity-80">
          <div className="w-14 h-14 rounded-2xl bg-slate-800 text-slate-300 flex items-center justify-center shadow-sm">
            <Camera className="w-6 h-6" />
          </div>
          <span className="text-xs font-medium text-slate-400">Camera</span>
        </div>
      </div>

      {/* Minimal Bottom Dock */}
      <div className="mt-auto pt-4 pb-2 z-10">
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-3 flex items-center justify-around shadow-lg">
          <div className="w-11 h-11 rounded-2xl bg-emerald-600 flex items-center justify-center text-white">
            <Phone className="w-5 h-5 fill-white" />
          </div>
          <div className="w-11 h-11 rounded-2xl bg-blue-600 flex items-center justify-center text-white">
            <MessageCircle className="w-5 h-5 fill-white" />
          </div>
          <button
            onClick={onOpenLoudbox}
            className="w-11 h-11 rounded-2xl bg-purple-600 hover:bg-purple-500 flex flex-col items-center justify-center text-white cursor-pointer transition active:scale-95"
            title="Launch Loudbox"
          >
            <span className="text-sm font-bold leading-none">₹</span>
            <span className="text-[8px] font-medium tracking-tight">Loudbox</span>
          </button>
          <div className="w-11 h-11 rounded-2xl bg-red-600 flex items-center justify-center text-white">
            <Chrome className="w-5 h-5" />
          </div>
        </div>
      </div>
    </div>
  );
};
