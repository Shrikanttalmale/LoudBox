import React from 'react';
import { 
  Search, 
  Mic, 
  Camera, 
  MessageCircle, 
  Phone, 
  Chrome, 
  ShoppingBag, 
  Sparkles,
  Volume2
} from 'lucide-react';

interface AndroidHomeScreenProps {
  onOpenSoundbox: () => void;
  isFirstLaunch: boolean;
}

export const AndroidHomeScreen: React.FC<AndroidHomeScreenProps> = ({
  onOpenSoundbox,
  isFirstLaunch,
}) => {
  const currentDate = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="relative w-full h-full min-h-[720px] bg-gradient-to-b from-indigo-950/70 via-slate-950 to-purple-950/80 p-5 flex flex-col justify-between select-none overflow-hidden text-white font-sans">
      {/* Background ambient wallpaper textures */}
      <div className="absolute top-12 left-8 w-64 h-64 bg-purple-600/20 blur-[90px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-24 right-8 w-60 h-60 bg-blue-600/15 blur-[90px] rounded-full pointer-events-none"></div>

      {/* Top Section: Date, Clock & Weather Widget */}
      <div className="pt-8 px-2 flex flex-col items-start z-10">
        <div className="text-5xl font-light tracking-tight text-white/95 font-sans">
          {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
        </div>
        <div className="flex items-center gap-2 mt-1 text-xs text-slate-300 font-medium">
          <span>{currentDate}</span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <span>28°C</span>
            <span className="text-amber-400">☀️</span>
            <span>Bengaluru</span>
          </span>
        </div>

        {/* Google Android Search Bar */}
        <div className="w-full mt-6 bg-slate-900/80 backdrop-blur-md border border-slate-700/60 rounded-full px-4 py-2.5 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2.5 text-xs text-slate-400">
            <span className="font-black text-sm tracking-tighter">
              <span className="text-blue-400">G</span>
              <span className="text-red-400">o</span>
              <span className="text-amber-400">o</span>
              <span className="text-blue-400">g</span>
              <span className="text-green-400">l</span>
              <span className="text-red-400">e</span>
            </span>
            <span className="text-slate-400">Search apps & web...</span>
          </div>
          <div className="flex items-center gap-3 text-slate-300">
            <Mic className="w-4 h-4 text-slate-300" />
            <Camera className="w-4 h-4 text-slate-300" />
          </div>
        </div>
      </div>

      {/* Middle Section: App Grid */}
      <div className="grid grid-cols-4 gap-y-7 gap-x-2 my-auto px-2 z-10">
        {/* Our SOUNDBOX App Icon with Highlight / Launch Hint */}
        <button
          onClick={onOpenSoundbox}
          className="flex flex-col items-center gap-1.5 transition transform hover:scale-105 active:scale-95 cursor-pointer relative group"
        >
          {/* Animated Glow & Launch Tag */}
          <div className="absolute -top-3.5 px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-black text-[9px] uppercase tracking-wider shadow-md animate-bounce flex items-center gap-0.5 z-20">
            <Sparkles className="w-2.5 h-2.5" />
            <span>Open</span>
          </div>

          <div className="relative">
            {/* Outer halo */}
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl blur-sm opacity-80 group-hover:opacity-100 transition"></div>
            
            {/* Soundbox App Icon */}
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 border-2 border-purple-400/60 shadow-xl flex items-center justify-center relative overflow-hidden z-10">
              <div className="absolute inset-0 bg-radial from-purple-400/30 to-transparent"></div>
              <div className="flex flex-col items-center justify-center">
                <span className="text-xl font-black text-white leading-none">₹</span>
                <Volume2 className="w-3.5 h-3.5 text-purple-200 mt-0.5" />
              </div>

              {isFirstLaunch && (
                <div className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-slate-900"></div>
              )}
            </div>
          </div>

          <span className="text-xs font-bold text-white tracking-wide text-center drop-shadow-md">
            Loudbox
          </span>
        </button>

        {/* Google Pay Icon */}
        <div className="flex flex-col items-center gap-1.5 opacity-90">
          <div className="w-14 h-14 rounded-2xl bg-white border border-slate-300 shadow-md flex items-center justify-center text-blue-600 font-black text-xl">
            G
          </div>
          <span className="text-xs font-medium text-slate-300">GPay</span>
        </div>

        {/* PhonePe Icon */}
        <div className="flex flex-col items-center gap-1.5 opacity-90">
          <div className="w-14 h-14 rounded-2xl bg-[#5f259f] border border-purple-400/40 shadow-md flex items-center justify-center text-white font-black text-sm">
            पे
          </div>
          <span className="text-xs font-medium text-slate-300">PhonePe</span>
        </div>

        {/* Paytm Icon */}
        <div className="flex flex-col items-center gap-1.5 opacity-90">
          <div className="w-14 h-14 rounded-2xl bg-[#00baF2] border border-cyan-400/40 shadow-md flex items-center justify-center text-white font-black text-xs">
            Paytm
          </div>
          <span className="text-xs font-medium text-slate-300">Paytm</span>
        </div>

        {/* WhatsApp Icon */}
        <div className="flex flex-col items-center gap-1.5 opacity-90">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500 border border-emerald-400/40 shadow-md flex items-center justify-center text-white">
            <MessageCircle className="w-7 h-7 fill-white" />
          </div>
          <span className="text-xs font-medium text-slate-300">WhatsApp</span>
        </div>

        {/* Chrome Icon */}
        <div className="flex flex-col items-center gap-1.5 opacity-90">
          <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-700 shadow-md flex items-center justify-center text-amber-400">
            <Chrome className="w-7 h-7" />
          </div>
          <span className="text-xs font-medium text-slate-300">Chrome</span>
        </div>

        {/* Store / Kirana Billing Icon */}
        <div className="flex flex-col items-center gap-1.5 opacity-90">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600 border border-indigo-400/40 shadow-md flex items-center justify-center text-white">
            <ShoppingBag className="w-7 h-7" />
          </div>
          <span className="text-xs font-medium text-slate-300">Kirana POS</span>
        </div>

        {/* Camera Icon */}
        <div className="flex flex-col items-center gap-1.5 opacity-90">
          <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 shadow-md flex items-center justify-center text-slate-300">
            <Camera className="w-7 h-7" />
          </div>
          <span className="text-xs font-medium text-slate-300">Camera</span>
        </div>
      </div>

      {/* Bottom Dock */}
      <div className="mt-auto pt-4 pb-2 px-3 z-10">
        <div className="bg-slate-900/70 backdrop-blur-xl border border-slate-700/60 rounded-3xl p-3 flex items-center justify-around shadow-2xl">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-md">
            <Phone className="w-6 h-6 fill-white" />
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-md">
            <MessageCircle className="w-6 h-6 fill-white" />
          </div>
          <button
            onClick={onOpenSoundbox}
            className="w-12 h-12 rounded-2xl bg-purple-600 hover:bg-purple-500 border border-purple-400 flex flex-col items-center justify-center text-white shadow-lg cursor-pointer transition transform active:scale-95"
            title="Launch Loudbox"
          >
            <span className="text-base font-black leading-none">₹</span>
            <span className="text-[8px] font-bold uppercase tracking-tighter">Alerts</span>
          </button>
          <div className="w-12 h-12 rounded-2xl bg-red-600 flex items-center justify-center text-white shadow-md">
            <Chrome className="w-6 h-6" />
          </div>
        </div>
      </div>
    </div>
  );
};
