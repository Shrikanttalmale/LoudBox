export type AppThemeId = 
  | 'midnight'        // Default: Modern Dark Slate & Neon Violet
  | 'light_daylight'   // Crisp Light Mode: High-contrast daylight Kirana
  | 'amoled_black'     // True AMOLED #000000: Max Battery Saver
  | 'emerald_cash'     // Merchant Emerald: Cash Flow & Prosperity Green
  | 'royal_blue'       // Fintech Royal Blue: Bank Trust & Cobalt
  | 'sunset_gold';     // Saffron & Gold: Festive Merchant Warmth

export interface AppThemeConfig {
  id: AppThemeId;
  name: string;
  nativeName: string;
  badge: string;
  description: string;
  tagline: string;
  isDark: boolean;
  batterySaver: boolean;
  batteryBenefit: string;
  previewColors: [string, string, string, string]; // [bg, card, accent, highlight]
  classes: {
    bgRoot: string;
    bgCard: string;
    bgCardAlt: string;
    border: string;
    borderHover: string;
    textPrimary: string;
    textSecondary: string;
    accentBg: string;
    accentText: string;
    accentGradient: string;
    accentBorder: string;
    navBg: string;
    pillBg: string;
  };
}

export const APP_THEMES: AppThemeConfig[] = [
  {
    id: 'midnight',
    name: 'Midnight Soundbox',
    nativeName: 'डिफ़ॉल्ट मिडनाइट',
    badge: '🌙',
    description: 'Deep slate & neon violet. Modern fintech soundbox look with soft contrast.',
    tagline: 'Balanced eye-comfort for evening & indoor counters',
    isDark: true,
    batterySaver: false,
    batteryBenefit: 'Standard OLED efficiency • Balanced indoor view',
    previewColors: ['#020617', '#0f172a', '#9333ea', '#38bdf8'],
    classes: {
      bgRoot: 'bg-slate-950 text-slate-100',
      bgCard: 'bg-slate-900/90',
      bgCardAlt: 'bg-slate-800/80',
      border: 'border-slate-800/80',
      borderHover: 'hover:border-purple-500/50',
      textPrimary: 'text-white',
      textSecondary: 'text-slate-400',
      accentBg: 'bg-purple-600',
      accentText: 'text-purple-400',
      accentGradient: 'from-purple-600 via-indigo-600 to-purple-800',
      accentBorder: 'border-purple-500/30',
      navBg: 'bg-slate-900/95',
      pillBg: 'bg-purple-950/70 text-purple-300 border-purple-800/50',
    },
  },
  {
    id: 'light_daylight',
    name: 'Daylight Kirana (Light)',
    nativeName: 'डेलाइट लाइट मोड',
    badge: '☀️',
    description: 'Crisp white & clean slate. Maximum readability under bright sun & fluorescent counter lights.',
    tagline: 'High glare resistance for outdoor & sunny roadside stores',
    isDark: false,
    batterySaver: false,
    batteryBenefit: 'Maximum 100% sunlight legibility from 5ft counter distance',
    previewColors: ['#f8fafc', '#ffffff', '#7c3aed', '#0284c7'],
    classes: {
      bgRoot: 'bg-slate-100 text-slate-900',
      bgCard: 'bg-white shadow-sm',
      bgCardAlt: 'bg-slate-50',
      border: 'border-slate-200',
      borderHover: 'hover:border-purple-400',
      textPrimary: 'text-slate-900',
      textSecondary: 'text-slate-500',
      accentBg: 'bg-purple-600',
      accentText: 'text-purple-600',
      accentGradient: 'from-purple-600 via-indigo-600 to-purple-700',
      accentBorder: 'border-purple-300',
      navBg: 'bg-white/95 border-t border-slate-200 shadow-lg',
      pillBg: 'bg-purple-100 text-purple-800 border-purple-200',
    },
  },
  {
    id: 'amoled_black',
    name: 'AMOLED Pure Black',
    nativeName: 'बैटरी सेवर (OLED)',
    badge: '⚡',
    description: 'True #000000 pitch black. Pixels shut off completely on OLED/AMOLED screens.',
    tagline: 'Runs all day on counter without draining battery',
    isDark: true,
    batterySaver: true,
    batteryBenefit: 'Saves up to 40% battery on AMOLED • Zero backlight glow',
    previewColors: ['#000000', '#0a0a0a', '#a855f7', '#22c55e'],
    classes: {
      bgRoot: 'bg-black text-zinc-100',
      bgCard: 'bg-zinc-950 border border-zinc-800',
      bgCardAlt: 'bg-zinc-900/90',
      border: 'border-zinc-850',
      borderHover: 'hover:border-zinc-600',
      textPrimary: 'text-white',
      textSecondary: 'text-zinc-400',
      accentBg: 'bg-zinc-800 border border-zinc-700',
      accentText: 'text-purple-400',
      accentGradient: 'from-zinc-900 via-purple-900 to-zinc-900',
      accentBorder: 'border-zinc-700',
      navBg: 'bg-black/95 border-t border-zinc-900',
      pillBg: 'bg-zinc-900 text-zinc-200 border-zinc-700',
    },
  },
  {
    id: 'emerald_cash',
    name: 'Merchant Emerald',
    nativeName: 'समृद्धि ग्रीन (Cash)',
    badge: '🌿',
    description: 'Deep forest green with fresh mint highlights. Symbol of financial prosperity & UPI green.',
    tagline: 'Traditional Indian prosperity aesthetic for grocery & retail counters',
    isDark: true,
    batterySaver: false,
    batteryBenefit: 'High contrast green numbers • Quick payment identification',
    previewColors: ['#022c22', '#064e3b', '#10b981', '#34d399'],
    classes: {
      bgRoot: 'bg-emerald-950 text-emerald-50',
      bgCard: 'bg-emerald-900/70 border border-emerald-800/60',
      bgCardAlt: 'bg-emerald-800/50',
      border: 'border-emerald-800/60',
      borderHover: 'hover:border-emerald-400/50',
      textPrimary: 'text-emerald-50',
      textSecondary: 'text-emerald-300/80',
      accentBg: 'bg-emerald-600',
      accentText: 'text-emerald-400',
      accentGradient: 'from-emerald-600 via-teal-600 to-emerald-800',
      accentBorder: 'border-emerald-500/40',
      navBg: 'bg-emerald-950/95 border-t border-emerald-900',
      pillBg: 'bg-emerald-900/80 text-emerald-200 border-emerald-700/50',
    },
  },
  {
    id: 'royal_blue',
    name: 'Fintech Royal Blue',
    nativeName: 'रॉयल बैंकिंग ब्लू',
    badge: '💎',
    description: 'Crisp banking navy and electric cobalt blue. Instills confidence and official payment authority.',
    tagline: 'Official banking aesthetic (Paytm, GPay, SBI style)',
    isDark: true,
    batterySaver: false,
    batteryBenefit: 'Official banking aesthetic • Trusted institutional feel',
    previewColors: ['#030712', '#0f172a', '#2563eb', '#38bdf8'],
    classes: {
      bgRoot: 'bg-slate-950 text-slate-50',
      bgCard: 'bg-slate-900/90 border border-blue-900/50',
      bgCardAlt: 'bg-blue-950/40',
      border: 'border-slate-800/80',
      borderHover: 'hover:border-blue-500/50',
      textPrimary: 'text-white',
      textSecondary: 'text-blue-200/70',
      accentBg: 'bg-blue-600',
      accentText: 'text-blue-400',
      accentGradient: 'from-blue-600 via-indigo-600 to-cyan-600',
      accentBorder: 'border-blue-500/40',
      navBg: 'bg-slate-950/95 border-t border-blue-950',
      pillBg: 'bg-blue-950/80 text-blue-200 border-blue-800/50',
    },
  },
  {
    id: 'sunset_gold',
    name: 'Saffron & Gold',
    nativeName: 'केसरिया गोल्ड (Festive)',
    badge: '✨',
    description: 'Rich dark amber and festive saffron gold. Perfect for sweet shops, jewelry, and festive seasons.',
    tagline: 'Warm celebratory aesthetic for Indian business celebrations',
    isDark: true,
    batterySaver: false,
    batteryBenefit: 'Warm festive amber glow • Premium celebratory appearance',
    previewColors: ['#1c1917', '#292524', '#f59e0b', '#fbbf24'],
    classes: {
      bgRoot: 'bg-stone-950 text-amber-50',
      bgCard: 'bg-stone-900/90 border border-amber-900/40',
      bgCardAlt: 'bg-amber-950/30',
      border: 'border-stone-800',
      borderHover: 'hover:border-amber-500/50',
      textPrimary: 'text-amber-50',
      textSecondary: 'text-amber-200/70',
      accentBg: 'bg-amber-600',
      accentText: 'text-amber-400',
      accentGradient: 'from-amber-600 via-orange-600 to-amber-700',
      accentBorder: 'border-amber-500/40',
      navBg: 'bg-stone-950/95 border-t border-stone-800',
      pillBg: 'bg-amber-950/80 text-amber-200 border-amber-800/50',
    },
  },
];

export const DEFAULT_THEME_ID: AppThemeId = 'midnight';

export function getThemeConfig(themeId: AppThemeId): AppThemeConfig {
  const found = APP_THEMES.find((t) => t.id === themeId);
  return found || APP_THEMES[0];
}
