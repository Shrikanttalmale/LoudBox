/**
 * Loudbox Audio & Voice Synthesis Engine
 * Generates UPI loudbox chimes using Web Audio API and produces
 * multi-lingual voice announcements using SpeechSynthesis with authentic
 * regional grammar, number-to-words conversion, and phonetic cross-voice fallbacks.
 */

import { getPersonaById } from './celebrityVoices';

export type UpiAppId = 'gpay' | 'phonepe' | 'paytm' | 'bhim' | 'amazonpay' | 'cred' | 'mobikwik';

export type LanguageCode =
  | 'mr'
  | 'hi'
  | 'en'
  | 'hinglish'
  | 'gu'
  | 'pa'
  | 'ta'
  | 'te'
  | 'kn'
  | 'bn'
  | 'ml'
  | 'or'
  | 'as'
  | 'bho'
  | 'raj';

export interface LanguageOption {
  code: LanguageCode;
  name: string;
  nativeName: string;
  badge: string;
  voiceLangCode: string;
  phoneticName: string;
  englishMeaning: string;
  region: string;
  sampleTemplate: (amount: number, appName: string) => string;
  phoneticSample: (amount: number, appName: string) => string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  {
    code: 'mr',
    name: 'Marathi',
    nativeName: 'मराठी',
    badge: 'म',
    voiceLangCode: 'mr-IN',
    phoneticName: 'Marathi',
    englishMeaning: 'Rupees received on [App]',
    region: 'Maharashtra',
    sampleTemplate: (amount, app) => `${app} वर ${formatMarathiAmount(amount)} रुपये मिळाले`,
    phoneticSample: (amount, app) => `${app} var ${formatMarathiPhoneticAmount(amount)} rupaye milale`,
  },
  {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिंदी',
    badge: 'हिं',
    voiceLangCode: 'hi-IN',
    phoneticName: 'Hindi',
    englishMeaning: 'Rupees received on [App]',
    region: 'North & Central India',
    sampleTemplate: (amount, app) => `${app} पर ${formatHindiAmount(amount)} रुपये प्राप्त हुए`,
    phoneticSample: (amount, app) => `${app} par ${formatHindiPhoneticAmount(amount)} rupaye prapt hue`,
  },
  {
    code: 'en',
    name: 'English',
    nativeName: 'English (India)',
    badge: 'EN',
    voiceLangCode: 'en-IN',
    phoneticName: 'English',
    englishMeaning: 'Rupees received on [App]',
    region: 'All India',
    sampleTemplate: (amount, app) => `Rupees ${amount} received on ${app}`,
    phoneticSample: (amount, app) => `Rupees ${amount} received on ${app}`,
  },
  {
    code: 'hinglish',
    name: 'Hinglish',
    nativeName: 'Hinglish',
    badge: 'H',
    voiceLangCode: 'hi-IN',
    phoneticName: 'Hinglish',
    englishMeaning: 'Rupees received on [App]',
    region: 'Bilingual India',
    sampleTemplate: (amount, app) => `${app} par ${amount} rupees receive hue`,
    phoneticSample: (amount, app) => `${app} par ${amount} rupees receive hue`,
  },
  {
    code: 'gu',
    name: 'Gujarati',
    nativeName: 'ગુજરાતી',
    badge: 'ગુ',
    voiceLangCode: 'gu-IN',
    phoneticName: 'Gujarati',
    englishMeaning: 'Rupees received on [App]',
    region: 'Gujarat',
    sampleTemplate: (amount, app) => `${app} પર ${formatGujaratiAmount(amount)} રૂપિયા મળ્યા`,
    phoneticSample: (amount, app) => `${app} par ${formatGujaratiPhoneticAmount(amount)} rupiya malya`,
  },
  {
    code: 'pa',
    name: 'Punjabi',
    nativeName: 'ਪੰਜਾਬੀ',
    badge: 'ਪੰ',
    voiceLangCode: 'pa-IN',
    phoneticName: 'Punjabi',
    englishMeaning: 'Rupees received on [App]',
    region: 'Punjab & Delhi',
    sampleTemplate: (amount, app) => `${app} ਤੇ ${formatPunjabiAmount(amount)} ਰੁਪਏ ਪ੍ਰਾਪਤ ਹੋਏ`,
    phoneticSample: (amount, app) => `${app} te ${formatPunjabiPhoneticAmount(amount)} rupaye prapat hoye`,
  },
  {
    code: 'ta',
    name: 'Tamil',
    nativeName: 'தமிழ்',
    badge: 'த',
    voiceLangCode: 'ta-IN',
    phoneticName: 'Tamil',
    englishMeaning: 'Rupees received via [App]',
    region: 'Tamil Nadu',
    sampleTemplate: (amount, app) => `${app} மூலம் ${formatTamilAmount(amount)} ரூபாய் பெறப்பட்டது`,
    phoneticSample: (amount, app) => `${app} moolam ${formatTamilPhoneticAmount(amount)} roobai perappattadhu`,
  },
  {
    code: 'te',
    name: 'Telugu',
    nativeName: 'తెలుగు',
    badge: 'తె',
    voiceLangCode: 'te-IN',
    phoneticName: 'Telugu',
    englishMeaning: 'Rupees received on [App]',
    region: 'Andhra Pradesh & Telangana',
    sampleTemplate: (amount, app) => `${app} లో ${formatTeluguAmount(amount)} రూపాయలు అందాయి`,
    phoneticSample: (amount, app) => `${app} lo ${formatTeluguPhoneticAmount(amount)} roopayalu andaayi`,
  },
  {
    code: 'kn',
    name: 'Kannada',
    nativeName: 'ಕನ್ನಡ',
    badge: 'ಕ',
    voiceLangCode: 'kn-IN',
    phoneticName: 'Kannada',
    englishMeaning: 'Rupees received on [App]',
    region: 'Karnataka',
    sampleTemplate: (amount, app) => `${app} ನಲ್ಲಿ ${formatKannadaAmount(amount)} ರೂಪಾಯಿ ಸ್ವೀಕರಿಸಲಾಗಿದೆ`,
    phoneticSample: (amount, app) => `${app} nalli ${formatKannadaPhoneticAmount(amount)} roopayi sweekarisalagide`,
  },
  {
    code: 'bn',
    name: 'Bengali',
    nativeName: 'বাংলা',
    badge: 'বা',
    voiceLangCode: 'bn-IN',
    phoneticName: 'Bengali',
    englishMeaning: 'Rupees received on [App]',
    region: 'West Bengal',
    sampleTemplate: (amount, app) => `${app} এ ${formatBengaliAmount(amount)} টাকা পাওয়া গেছে`,
    phoneticSample: (amount, app) => `${app} e ${formatBengaliPhoneticAmount(amount)} taka paowa gechhe`,
  },
  {
    code: 'ml',
    name: 'Malayalam',
    nativeName: 'മലയാളം',
    badge: 'മ',
    voiceLangCode: 'ml-IN',
    phoneticName: 'Malayalam',
    englishMeaning: 'Rupees received via [App]',
    region: 'Kerala',
    sampleTemplate: (amount, app) => `${app} വഴി ${formatMalayalamAmount(amount)} രൂപ ലഭിച്ചു`,
    phoneticSample: (amount, app) => `${app} vazhi ${formatMalayalamPhoneticAmount(amount)} roopa labhichu`,
  },
  {
    code: 'or',
    name: 'Odia',
    nativeName: 'ଓଡ଼ିଆ',
    badge: 'ଓ',
    voiceLangCode: 'or-IN',
    phoneticName: 'Odia',
    englishMeaning: 'Rupees received on [App]',
    region: 'Odisha',
    sampleTemplate: (amount, app) => `${app} ରେ ${formatOdiaAmount(amount)} ଟଙ୍କା ମିଳିଲା`,
    phoneticSample: (amount, app) => `${app} re ${formatOdiaPhoneticAmount(amount)} tanka milila`,
  },
  {
    code: 'as',
    name: 'Assamese',
    nativeName: 'অসমীয়া',
    badge: 'অ',
    voiceLangCode: 'as-IN',
    phoneticName: 'Assamese',
    englishMeaning: 'Rupees received on [App]',
    region: 'Assam & North East',
    sampleTemplate: (amount, app) => `${app} ত ${formatAssameseAmount(amount)} টকা লাভ হ'ল`,
    phoneticSample: (amount, app) => `${app} t ${formatAssamesePhoneticAmount(amount)} toka laabh hol`,
  },
  {
    code: 'bho',
    name: 'Bhojpuri',
    nativeName: 'भोजपुरी',
    badge: 'भो',
    voiceLangCode: 'hi-IN',
    phoneticName: 'Bhojpuri',
    englishMeaning: 'Rupees received on [App]',
    region: 'Bihar & Purvanchal UP',
    sampleTemplate: (amount, app) => `${app} पर ${formatBhojpuriAmount(amount)} रुपया मिलल`,
    phoneticSample: (amount, app) => `${app} par ${formatBhojpuriPhoneticAmount(amount)} rupaya milal`,
  },
  {
    code: 'raj',
    name: 'Rajasthani',
    nativeName: 'राजस्थानी',
    badge: 'रा',
    voiceLangCode: 'hi-IN',
    phoneticName: 'Rajasthani',
    englishMeaning: 'Rupees received on [App]',
    region: 'Rajasthan & Marwar',
    sampleTemplate: (amount, app) => `${app} माथे ${formatRajasthaniAmount(amount)} रुपया मिल्या`,
    phoneticSample: (amount, app) => `${app} mathe ${formatRajasthaniPhoneticAmount(amount)} rupya milya`,
  },
];

export interface AudioSettings {
  volume: number; // 0 to 1
  rate: number; // 0.8 to 1.5
  pitch: number; // 0.8 to 1.2
  chimeStyle: 'paytm' | 'phonepe' | 'gpay' | 'classic' | 'bell';
  selectedLanguage: LanguageCode;
  repeatAlert: boolean;
  voiceMode?: 'auto' | 'native' | 'phonetic';
  preferredVoiceUri?: string;
  voicePersonaId?: string; // Celebrity/Singer voice persona id, e.g. 'mr_ashok_saraf', 'hi_amitabh', 'ta_rajini'
  announceSenderName?: boolean; // ON/OFF setting for sender/payer name announcements
}

export const DEFAULT_AUDIO_SETTINGS: AudioSettings = {
  volume: 1.0,
  rate: 1.0,
  pitch: 1.0,
  chimeStyle: 'paytm',
  selectedLanguage: 'mr',
  repeatAlert: false,
  voiceMode: 'auto',
  voicePersonaId: undefined, // Normal standard loudbox voice
  announceSenderName: true, // Default to ON for announcing payer name
};


// Web Audio Context Singleton
let audioCtx: AudioContext | null = null;

// Initialize speech synthesis voices on start
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  window.speechSynthesis.getVoices();
  window.speechSynthesis.onvoiceschanged = () => {
    window.speechSynthesis.getVoices();
  };
}

export function unlockAudioContext(): void {
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
  } catch (e) {
    console.warn('Could not unlock audio context:', e);
  }
}

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Play authentic loudbox chime based on style
 */
export async function playSoundboxChime(
  style: AudioSettings['chimeStyle'] = 'paytm',
  volume = 1.0
): Promise<void> {
  return playLoudboxChime(style, volume);
}

export async function playLoudboxChime(
  style: AudioSettings['chimeStyle'] = 'paytm',
  volume = 1.0
): Promise<void> {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(Math.min(1.0, volume), now);
    masterGain.connect(ctx.destination);

    if (style === 'paytm') {
      // Signature Paytm Loudbox 4-step chime: E5 -> G#5 -> B5 -> E6
      const notes = [
        { freq: 659.25, start: 0.0, dur: 0.12 },
        { freq: 830.61, start: 0.13, dur: 0.12 },
        { freq: 987.77, start: 0.26, dur: 0.14 },
        { freq: 1318.51, start: 0.42, dur: 0.45 },
      ];
      notes.forEach(({ freq, start, dur }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + start);
        gain.gain.setValueAtTime(0.001, now + start);
        gain.gain.exponentialRampToValueAtTime(0.65, now + start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + start + dur);
        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(now + start);
        osc.stop(now + start + dur + 0.05);
      });
      return new Promise((resolve) => setTimeout(resolve, 850));
    }

    if (style === 'phonepe') {
      // Signature PhonePe melody: High crisp double ding-dong (A5 -> D6)
      const notes = [
        { freq: 880.0, start: 0.0, dur: 0.18 },
        { freq: 1174.66, start: 0.18, dur: 0.5 },
      ];
      notes.forEach(({ freq, start, dur }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + start);
        gain.gain.setValueAtTime(0.001, now + start);
        gain.gain.exponentialRampToValueAtTime(0.7, now + start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + start + dur);
        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(now + start);
        osc.stop(now + start + dur + 0.05);
      });
      return new Promise((resolve) => setTimeout(resolve, 750));
    }

    if (style === 'gpay') {
      // Google Pay cheerful tri-tone chime (C5 -> E5 -> G5)
      const notes = [
        { freq: 523.25, start: 0.0, dur: 0.12 },
        { freq: 659.25, start: 0.12, dur: 0.12 },
        { freq: 783.99, start: 0.24, dur: 0.4 },
      ];
      notes.forEach(({ freq, start, dur }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + start);
        gain.gain.setValueAtTime(0.001, now + start);
        gain.gain.exponentialRampToValueAtTime(0.6, now + start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + start + dur);
        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(now + start);
        osc.stop(now + start + dur + 0.05);
      });
      return new Promise((resolve) => setTimeout(resolve, 700));
    }

    if (style === 'bell') {
      // Counter Bell ping
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, now);
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(0.8, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(now);
      osc.stop(now + 0.85);
      return new Promise((resolve) => setTimeout(resolve, 850));
    }

    // Classic single beep
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    gain.gain.setValueAtTime(0.6, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(now);
    osc.stop(now + 0.4);
    return new Promise((resolve) => setTimeout(resolve, 450));
  } catch (err) {
    console.warn('Audio chime fallback:', err);
    return Promise.resolve();
  }
}

/**
 * Play authentic celebrity & singer audio stings using Web Audio API synthesis
 */
export async function playCelebritySting(
  sting:
    | 'boom'
    | 'comedy_bounce'
    | 'whistle_beat'
    | 'punch_whoosh'
    | 'brass_fanfare'
    | 'dhol_tasha'
    | 'bhangra_beat'
    | 'acoustic_strings'
    | 'retro_horn'
    | 'garba_click'
    | 'sub_bass'
    | 'temple_bell',
  volume = 1.0
): Promise<void> {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(Math.min(1.0, volume), now);
    masterGain.connect(ctx.destination);

    if (sting === 'comedy_bounce') {
      // Ashok Saraf & Baburao Cartoon Spring Boing
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.exponentialRampToValueAtTime(720, now + 0.12);
      osc.frequency.exponentialRampToValueAtTime(310, now + 0.26);
      osc.frequency.exponentialRampToValueAtTime(620, now + 0.42);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.7, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(now);
      osc.stop(now + 0.52);
      return new Promise((r) => setTimeout(r, 550));
    }

    if (sting === 'boom') {
      // Amitabh Bachchan & Krantiveer Dramatic Deep Bass Boom
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(38, now + 0.42);

      gain.gain.setValueAtTime(0.85, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(now);
      osc.stop(now + 0.7);
      return new Promise((r) => setTimeout(r, 680));
    }

    if (sting === 'dhol_tasha') {
      // Ajay-Atul & Pawan Singh Marathi Dhol-Tasha burst
      // Hit 1: Low dhol thump
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(110, now);
      osc1.frequency.exponentialRampToValueAtTime(45, now + 0.15);
      gain1.gain.setValueAtTime(0.8, now);
      gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      osc1.connect(gain1);
      gain1.connect(masterGain);
      osc1.start(now);
      osc1.stop(now + 0.22);

      // Hit 2: High sharp tasha rim
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'square';
      osc2.frequency.setValueAtTime(380, now + 0.12);
      osc2.frequency.exponentialRampToValueAtTime(180, now + 0.25);
      gain2.gain.setValueAtTime(0.6, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.32);
      osc2.connect(gain2);
      gain2.connect(masterGain);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.35);

      // Hit 3: Cymbal splash ring
      const osc3 = ctx.createOscillator();
      const gain3 = ctx.createGain();
      osc3.type = 'sine';
      osc3.frequency.setValueAtTime(880, now + 0.22);
      gain3.gain.setValueAtTime(0.5, now + 0.22);
      gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
      osc3.connect(gain3);
      gain3.connect(masterGain);
      osc3.start(now + 0.22);
      osc3.stop(now + 0.7);

      return new Promise((r) => setTimeout(r, 720));
    }

    if (sting === 'punch_whoosh') {
      // Rajinikanth / Singham / Pushpa heroic swoosh & punch
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(650, now);
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.25);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.8, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(now);
      osc.stop(now + 0.42);
      return new Promise((r) => setTimeout(r, 450));
    }

    if (sting === 'acoustic_strings') {
      // Arijit Singh & Sonu Nigam Gentle Acoustic Arpeggio
      const notes = [
        { freq: 261.63, start: 0.0, dur: 0.3 }, // C4
        { freq: 329.63, start: 0.08, dur: 0.3 }, // E4
        { freq: 392.0, start: 0.16, dur: 0.35 }, // G4
        { freq: 523.25, start: 0.24, dur: 0.5 }, // C5
      ];
      notes.forEach(({ freq, start, dur }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + start);
        gain.gain.setValueAtTime(0.001, now + start);
        gain.gain.linearRampToValueAtTime(0.45, now + start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + start + dur);
        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(now + start);
        osc.stop(now + start + dur + 0.05);
      });
      return new Promise((r) => setTimeout(r, 750));
    }

    if (sting === 'bhangra_beat') {
      // Diljit Dosanjh & Sidhu Moose Wala energetic dholak roll
      const notes = [
        { freq: 140, start: 0.0, dur: 0.1 },
        { freq: 180, start: 0.1, dur: 0.1 },
        { freq: 95, start: 0.2, dur: 0.3 },
      ];
      notes.forEach(({ freq, start, dur }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + start);
        gain.gain.setValueAtTime(0.7, now + start);
        gain.gain.exponentialRampToValueAtTime(0.01, now + start + dur);
        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(now + start);
        osc.stop(now + start + dur + 0.02);
      });
      return new Promise((r) => setTimeout(r, 550));
    }

    // Default to classic loudbox chime for other stings
    return playLoudboxChime('paytm', volume);
  } catch (err) {
    console.warn('Sting playback error:', err);
    return Promise.resolve();
  }
}

/* =======================================================================
   COMPREHENSIVE REGIONAL NUMBER-TO-WORDS DICTIONARIES & PHONETICS
======================================================================= */

// 1. MARATHI (मराठी) - 1 to 100
const MARATHI_NUMS_1_TO_100: string[] = [
  '', 'एक', 'दोन', 'तीन', 'चार', 'पाच', 'सहा', 'सात', 'आठ', 'नऊ', 'दहा',
  'अकरा', 'बारा', 'तेरा', 'चौदा', 'पंधरा', 'सोळा', 'सतरा', 'अठरा', 'एकोणीस', 'वीस',
  'एकवीस', 'बावीस', 'तेवीस', 'चोवीस', 'पंचवीस', 'छव्वीस', 'सत्तावीस', 'अठ्ठावीस', 'एकोणतीस', 'तीस',
  'एकतीस', 'बत्तीस', 'तेहेतीस', 'चौतीस', 'पस्तीस', 'छत्तीस', 'सदतीस', 'अडतीस', 'एकोणचाळीस', 'चाळीस',
  'एकेचाळीस', 'बेचाळीस', 'त्रेचाळीस', 'चव्वेचाळीस', 'पंचेचाळीस', 'शेहेचाळीस', 'सत्तेचाळीस', 'अठ्ठेचाळीस', 'एकोणपन्नास', 'पन्नास',
  'एकावन्न', 'बावन्न', 'त्रेपन्न', 'चौपन्न', 'पंचावन्न', 'छप्पन्न', 'सत्तावन्न', 'अठ्ठावन्न', 'एकोणसाठ', 'साठ',
  'एकसष्ठ', 'बासष्ठ', 'त्रेसष्ठ', 'चौसष्ठ', 'पासष्ठ', 'शासष्ठ', 'सदसष्ठ', 'अडसष्ठ', 'एकोणसत्तर', 'सत्तर',
  'एकाहत्तर', 'बहात्तर', 'त्र्याहत्तर', 'चौऱ्याहत्तर', 'पंचाहत्तर', 'शहात्तर', 'सत्याहत्तर', 'अठ्ठ्याहत्तर', 'एकोणांशी', 'ऐंशी',
  'एक्यांशी', 'ब्यांशी', 'त्र्यांशी', 'चौऱ्यांशी', 'पंच्यांशी', 'शहांशी', 'सत्यांशी', 'अठ्ठ्यांशी', 'एकोणनव्वद', 'नव्वद',
  'एक्याण्णव', 'ब्याण्णव', 'त्र्याण्णव', 'चौऱ्याण्णव', 'पंच्याण्णव', 'शहाण्णव', 'सत्याण्णव', 'अठ्ठ्याण्णव', 'नव्व्याण्णव', 'शंभर'
];

const MARATHI_PHONETIC_1_TO_100: string[] = [
  '', 'ek', 'don', 'teen', 'chaar', 'paach', 'saha', 'saat', 'aath', 'nau', 'daha',
  'akara', 'baara', 'tera', 'chauda', 'pandhra', 'sola', 'satra', 'athara', 'ekonis', 'vees',
  'ekvees', 'baavees', 'tevees', 'chovees', 'panchvees', 'chhavvees', 'sattavees', 'atthavees', 'ekontees', 'tees',
  'ektees', 'battees', 'teheteas', 'chowtees', 'pastees', 'chhattees', 'sadtees', 'adtees', 'ekonchalees', 'chaalees',
  'ekechalees', 'bechalees', 'trechalees', 'chavvechalees', 'panchechalees', 'shehechalees', 'sattechalees', 'atthechalees', 'ekonpannaas', 'pannaas',
  'ekaavanna', 'baavanna', 'trepanna', 'chowpanna', 'panchaavanna', 'chhappanna', 'sattaavanna', 'atthaavanna', 'ekonsaath', 'saath',
  'eksath', 'baasath', 'tresath', 'chousath', 'paasath', 'shaasath', 'sadasath', 'adasath', 'ekonsattar', 'sattar',
  'ekaahattar', 'bahaattar', 'tryaahattar', 'chowryaahattar', 'panchaahattar', 'shahaattar', 'satyaahattar', 'atthyaahattar', 'ekonaanshee', 'einshee',
  'ekyaanshee', 'byaanshee', 'tryaanshee', 'chowryaanshee', 'panchyaanshee', 'shahaanshee', 'satyaanshee', 'atthyaanshee', 'ekonnavvad', 'navvad',
  'ekyaannav', 'byaannav', 'tryaannav', 'chowryaannav', 'panchyaannav', 'shahaannav', 'satyaannav', 'atthyaannav', 'navvyaannav', 'shambhar'
];

/**
 * Format Marathi amount to words for flawless pronunciation.
 * Supports numbers up to 99,999.
 */
export function formatMarathiAmount(amount: number): string {
  if (amount <= 0) return 'शून्य';
  if (amount <= 100) return MARATHI_NUMS_1_TO_100[amount] || `${amount}`;

  if (amount < 1000) {
    const hundreds = Math.floor(amount / 100);
    const rem = amount % 100;
    const hWords = ['', 'एकशे', 'दोनशे', 'तीनशे', 'चारशे', 'पाचशे', 'सहाशे', 'सातशे', 'आठशे', 'नऊशे'];
    const hPrefix = hundreds === 1 && rem === 0 ? 'शंभर' : hWords[hundreds];
    return rem === 0 ? hPrefix : `${hPrefix} ${MARATHI_NUMS_1_TO_100[rem]}`;
  }

  const thousands = Math.floor(amount / 1000);
  const rem = amount % 1000;
  const tPrefix = thousands <= 100 ? MARATHI_NUMS_1_TO_100[thousands] : `${thousands}`;

  if (rem === 0) {
    return `${tPrefix} हजार`;
  }
  return `${tPrefix} हजार ${formatMarathiAmount(rem)}`;
}

export function formatMarathiPhoneticAmount(amount: number): string {
  if (amount <= 0) return 'shunya';
  if (amount <= 100) return MARATHI_PHONETIC_1_TO_100[amount] || `${amount}`;

  if (amount < 1000) {
    const hundreds = Math.floor(amount / 100);
    const rem = amount % 100;
    const hWords = ['', 'ekshe', 'donshe', 'teenshe', 'chaarshe', 'paachshe', 'sahashe', 'saatshe', 'aathshe', 'naushe'];
    const hPrefix = hundreds === 1 && rem === 0 ? 'shambhar' : hWords[hundreds];
    return rem === 0 ? hPrefix : `${hPrefix} ${MARATHI_PHONETIC_1_TO_100[rem]}`;
  }

  const thousands = Math.floor(amount / 1000);
  const rem = amount % 1000;
  const tPrefix = thousands <= 100 ? MARATHI_PHONETIC_1_TO_100[thousands] : `${thousands}`;

  if (rem === 0) {
    return `${tPrefix} hajaar`;
  }
  return `${tPrefix} hajaar ${formatMarathiPhoneticAmount(rem)}`;
}

// 2. HINDI (हिंदी) - 1 to 100
const HINDI_NUMS_1_TO_100: string[] = [
  '', 'एक', 'दो', 'तीन', 'चार', 'पाँच', 'छह', 'सात', 'आठ', 'नौ', 'दस',
  'ग्यारह', 'बारह', 'तेरह', 'चौदह', 'पंद्रह', 'सोलह', 'सत्रह', 'अठारह', 'उन्नीस', 'बीस',
  'इक्कीस', 'बाइस', 'तेईस', 'चौबीस', 'पच्चीस', 'छब्बीस', 'सत्ताईस', 'अट्ठाईस', 'उनतीस', 'तीस',
  'इकत्तीस', 'बत्तीस', 'तैंतीस', 'चौंतीस', 'पैंतीस', 'छत्तीस', 'सैंतीस', 'अड़तीस', 'उनतालीस', 'चालीस',
  'इकतालीस', 'बयालीस', 'तैंतालीस', 'चवालीस', 'पैंतालीस', 'छियालीस', 'सैंतालीस', 'अड़तालीस', 'उनचास', 'पचास',
  'इक्यावन', 'बावन', 'तिरपन', 'चौवन', 'बचपन', 'छप्पन', 'सत्तावन', 'अट्ठावन', 'उनसठ', 'साठ',
  'इकसठ', 'बासठ', 'तिरसठ', 'चौंसठ', 'पैंसठ', 'छियासठ', 'सरसठ', 'अड़सठ', 'उनहत्तर', 'सत्तर',
  'इकहत्तर', 'बहत्तर', 'तिहत्तर', 'चौहत्तर', 'पचहत्तर', 'छिहत्तर', 'सतहत्तर', 'अठहत्तर', 'उन्यासी', 'अस्सी',
  'इक्यासी', 'बयासी', 'तिरासी', 'चौरासी', 'पचासी', 'छियासी', 'सत्तासी', 'अट्ठासी', 'नवासी', 'नब्बे',
  'इक्यानवे', 'बानवे', 'तिराने', 'चौरानवे', 'पचानवे', 'छियानवे', 'सत्तानवे', 'अट्ठानवे', 'निन्यानवे', 'एक सौ'
];

const HINDI_PHONETIC_1_TO_100: string[] = [
  '', 'ek', 'do', 'teen', 'chaar', 'paanch', 'chheh', 'saat', 'aath', 'nau', 'das',
  'gyaarah', 'baarah', 'terah', 'chaudah', 'pandrah', 'solah', 'satrah', 'athaarah', 'unnees', 'bees',
  'ikkees', 'baees', 'te-ees', 'chaubees', 'pachchees', 'chhabbees', 'sattaees', 'atthaees', 'untees', 'tees',
  'ikattees', 'battees', 'taintees', 'chauntees', 'paintees', 'chhattees', 'saintees', 'adtees', 'untaalees', 'chaalees',
  'iktaalees', 'bayaalees', 'taintaalees', 'chawaalees', 'paintaalees', 'chhiyaalees', 'saintaalees', 'adtaalees', 'unchaas', 'pachaas',
  'ikyaavan', 'baavan', 'tirpan', 'chauvan', 'pachpan', 'chhappan', 'sattaavan', 'atthaavan', 'unsath', 'saath',
  'iksath', 'baasath', 'tirsath', 'chaunsath', 'painsath', 'chhiyaasath', 'sarsath', 'adsath', 'unhattar', 'sattar',
  'ikhattar', 'bahattar', 'tihattar', 'chauhattar', 'pachhattar', 'chhihattar', 'sat-hattar', 'ath-hattar', 'unyaasi', 'assee',
  'ikyaasi', 'bayaasi', 'tiraasi', 'chauraasi', 'pachaasi', 'chhiyaasi', 'sattaasi', 'atthaasi', 'nawaasi', 'nabbe',
  'ikyaanve', 'baanve', 'tiraanve', 'chauraanve', 'pachaanve', 'chhiyaanve', 'sattaanve', 'atthaanve', 'ninyaanve', 'ek sau'
];

export function formatHindiAmount(amount: number): string {
  if (amount <= 0) return 'शून्य';
  if (amount <= 100) return HINDI_NUMS_1_TO_100[amount] || `${amount}`;

  if (amount < 1000) {
    const hundreds = Math.floor(amount / 100);
    const rem = amount % 100;
    const hWords = ['', 'एक सौ', 'दो सौ', 'तीन सौ', 'चार सौ', 'पाँच सौ', 'छह सौ', 'सात सौ', 'आठ सौ', 'नौ सौ'];
    return rem === 0 ? hWords[hundreds] : `${hWords[hundreds]} ${HINDI_NUMS_1_TO_100[rem]}`;
  }

  const thousands = Math.floor(amount / 1000);
  const rem = amount % 1000;
  const tPrefix = thousands <= 100 ? HINDI_NUMS_1_TO_100[thousands] : `${thousands}`;
  return rem === 0 ? `${tPrefix} हज़ार` : `${tPrefix} हज़ार ${formatHindiAmount(rem)}`;
}

export function formatHindiPhoneticAmount(amount: number): string {
  if (amount <= 0) return 'shunya';
  if (amount <= 100) return HINDI_PHONETIC_1_TO_100[amount] || `${amount}`;

  if (amount < 1000) {
    const hundreds = Math.floor(amount / 100);
    const rem = amount % 100;
    const hWords = ['', 'ek sau', 'do sau', 'teen sau', 'chaar sau', 'paanch sau', 'chheh sau', 'saat sau', 'aath sau', 'nau sau'];
    return rem === 0 ? hWords[hundreds] : `${hWords[hundreds]} ${HINDI_PHONETIC_1_TO_100[rem]}`;
  }

  const thousands = Math.floor(amount / 1000);
  const rem = amount % 1000;
  const tPrefix = thousands <= 100 ? HINDI_PHONETIC_1_TO_100[thousands] : `${thousands}`;
  return rem === 0 ? `${tPrefix} hazaar` : `${tPrefix} hazaar ${formatHindiPhoneticAmount(rem)}`;
}

// 3. GUJARATI (ગુજરાતી)
export function formatGujaratiAmount(amount: number): string {
  if (amount === 10) return 'દસ';
  if (amount === 20) return 'વીસ';
  if (amount === 25) return 'પચ્ચીસ';
  if (amount === 50) return 'પચાસ';
  if (amount === 100) return 'એકસો';
  if (amount === 150) return 'એકસો પચાસ';
  if (amount === 200) return 'બસો';
  if (amount === 250) return 'બસો પચાસ';
  if (amount === 500) return 'પાંચસો';
  if (amount === 750) return 'સાતસો પચાસ';
  if (amount === 1000) return 'એક હજાર';
  if (amount === 2000) return 'બે હજાર';
  if (amount === 5000) return 'પાંચ હજાર';
  if (amount < 100) return formatHindiAmount(amount); // Closely related phonemes
  if (amount < 1000) {
    const hundreds = Math.floor(amount / 100);
    const rem = amount % 100;
    const h = ['', 'એકસો', 'બસો', 'ત્રણસો', 'ચારસો', 'પાંચસો', 'છસો', 'સાતસો', 'આઠસો', 'નવસો'][hundreds] || `${hundreds}સો`;
    return rem === 0 ? h : `${h} ${rem}`;
  }
  const th = Math.floor(amount / 1000);
  const rem = amount % 1000;
  return rem === 0 ? `${th} હજાર` : `${th} હજાર ${formatGujaratiAmount(rem)}`;
}

export function formatGujaratiPhoneticAmount(amount: number): string {
  if (amount === 10) return 'das';
  if (amount === 20) return 'vees';
  if (amount === 25) return 'pachchees';
  if (amount === 50) return 'pachaas';
  if (amount === 100) return 'ekso';
  if (amount === 200) return 'baso';
  if (amount === 500) return 'paanchso';
  if (amount === 1000) return 'ek hajaar';
  if (amount === 2000) return 'be hajaar';
  return formatHindiPhoneticAmount(amount);
}

// 4. PUNJABI (ਪੰਜਾਬੀ)
export function formatPunjabiAmount(amount: number): string {
  if (amount === 10) return 'ਦਸ';
  if (amount === 20) return 'ਵੀਹ';
  if (amount === 25) return 'ਪੱਚੀ';
  if (amount === 50) return 'ਪੰਜਾਹ';
  if (amount === 100) return 'ਇੱਕ ਸੌ';
  if (amount === 200) return 'ਦੋ ਸੌ';
  if (amount === 500) return 'ਪੰਜ ਸੌ';
  if (amount === 1000) return 'ਇੱਕ ਹਜ਼ਾਰ';
  if (amount === 2000) return 'ਦੋ ਹਜ਼ਾਰ';
  if (amount === 5000) return 'ਪੰਜ ਹਜ਼ਾਰ';
  return formatHindiAmount(amount);
}

export function formatPunjabiPhoneticAmount(amount: number): string {
  if (amount === 10) return 'das';
  if (amount === 20) return 'veeh';
  if (amount === 50) return 'panjaah';
  if (amount === 100) return 'ikk sau';
  if (amount === 200) return 'do sau';
  if (amount === 500) return 'panj sau';
  if (amount === 1000) return 'ikk hazaar';
  return formatHindiPhoneticAmount(amount);
}

// 5. BENGALI (বাংলা)
export function formatBengaliAmount(amount: number): string {
  if (amount === 10) return 'দশ';
  if (amount === 20) return 'বিশ';
  if (amount === 25) return 'পঁচিশ';
  if (amount === 50) return 'পঞ্চাশ';
  if (amount === 100) return 'একশো';
  if (amount === 200) return 'দুশো';
  if (amount === 500) return 'পাঁচশো';
  if (amount === 1000) return 'এক হাজার';
  if (amount === 2000) return 'দুই হাজার';
  if (amount === 5000) return 'পাঁচ হাজার';
  return `${amount}`;
}

export function formatBengaliPhoneticAmount(amount: number): string {
  if (amount === 10) return 'dosh';
  if (amount === 20) return 'beesh';
  if (amount === 50) return 'ponchaash';
  if (amount === 100) return 'eksho';
  if (amount === 200) return 'doosho';
  if (amount === 500) return 'paanchsho';
  if (amount === 1000) return 'ek hajaar';
  return `${amount}`;
}

// 6. TAMIL (தமிழ்)
export function formatTamilAmount(amount: number): string {
  if (amount === 10) return 'பத்து';
  if (amount === 20) return 'இருபது';
  if (amount === 50) return 'ஐம்பது';
  if (amount === 100) return 'நூறு';
  if (amount === 200) return 'இருநூறு';
  if (amount === 500) return 'ஐந்நூறு';
  if (amount === 1000) return 'ஆயிரம்';
  if (amount === 2000) return 'இரண்டாயிரம்';
  if (amount === 5000) return 'ஐந்தாயிரம்';
  return `${amount}`;
}

export function formatTamilPhoneticAmount(amount: number): string {
  if (amount === 10) return 'patthu';
  if (amount === 20) return 'irubadhu';
  if (amount === 50) return 'aimbadhu';
  if (amount === 100) return 'nooru';
  if (amount === 200) return 'irunnooru';
  if (amount === 500) return 'ainnooru';
  if (amount === 1000) return 'aayiram';
  return `${amount}`;
}

// 7. TELUGU (తెలుగు)
export function formatTeluguAmount(amount: number): string {
  if (amount === 10) return 'పది';
  if (amount === 20) return 'ఇరవై';
  if (amount === 50) return 'యాభై';
  if (amount === 100) return 'వంద';
  if (amount === 200) return 'రెండు వందల';
  if (amount === 500) return 'ఐదు వందల';
  if (amount === 1000) return 'వెయ్యి';
  if (amount === 2000) return 'రెండు వేల';
  return `${amount}`;
}

export function formatTeluguPhoneticAmount(amount: number): string {
  if (amount === 10) return 'padi';
  if (amount === 20) return 'iravai';
  if (amount === 50) return 'yaabhai';
  if (amount === 100) return 'vanda';
  if (amount === 200) return 'rendu vandhala';
  if (amount === 500) return 'aidu vandhala';
  if (amount === 1000) return 'veyyi';
  return `${amount}`;
}

// 8. KANNADA (ಕನ್ನಡ)
export function formatKannadaAmount(amount: number): string {
  if (amount === 10) return 'ಹತ್ತು';
  if (amount === 20) return 'ಇಪ್ಪತ್ತು';
  if (amount === 50) return 'ಐವತ್ತು';
  if (amount === 100) return 'ನೂರು';
  if (amount === 200) return 'ಇನ್ನೂರು';
  if (amount === 500) return 'ಐದು ನೂರು';
  if (amount === 1000) return 'ಒಂದು ಸಾವಿರ';
  if (amount === 2000) return 'ಎರಡು ಸಾವಿರ';
  return `${amount}`;
}

export function formatKannadaPhoneticAmount(amount: number): string {
  if (amount === 10) return 'hatthu';
  if (amount === 20) return 'ippatthu';
  if (amount === 50) return 'aivatthu';
  if (amount === 100) return 'nooru';
  if (amount === 200) return 'innooru';
  if (amount === 500) return 'aidu nooru';
  if (amount === 1000) return 'ondu saavira';
  return `${amount}`;
}

// 9. MALAYALAM (മലയാളം)
export function formatMalayalamAmount(amount: number): string {
  if (amount === 10) return 'പത്ത്';
  if (amount === 20) return 'ഇരുപത്';
  if (amount === 50) return 'അമ്പത്';
  if (amount === 100) return 'നൂറ്';
  if (amount === 200) return 'ഇരുന്നൂറ്';
  if (amount === 500) return 'അഞ്ഞൂറ്';
  if (amount === 1000) return 'ആയിരം';
  if (amount === 2000) return 'രണ്ടായിരം';
  if (amount === 5000) return 'അയ്യായിരം';
  if (amount < 100) return `${amount}`;
  if (amount < 1000) {
    const h = Math.floor(amount / 100);
    const rem = amount % 100;
    const hWords = ['', 'നൂറ്', 'ഇരുന്നൂറ്', 'മുഞ്ഞൂറ്', 'നാനൂറ്', 'അഞ്ഞൂറ്', 'അറുന്നൂറ്', 'എഴുന്നൂറ്', 'എണ്ണൂറ്', 'തൊള്ളായിരം'];
    const prefix = hWords[h] || `${h} നൂറ്`;
    return rem === 0 ? prefix : `${prefix} ${rem}`;
  }
  const th = Math.floor(amount / 1000);
  const rem = amount % 1000;
  return rem === 0 ? `${th} ആയിരം` : `${th} ആയിരം ${formatMalayalamAmount(rem)}`;
}

export function formatMalayalamPhoneticAmount(amount: number): string {
  if (amount === 10) return 'patthu';
  if (amount === 20) return 'irubathu';
  if (amount === 50) return 'ambathu';
  if (amount === 100) return 'nooru';
  if (amount === 200) return 'irunnooru';
  if (amount === 500) return 'anjooru';
  if (amount === 1000) return 'aayiram';
  if (amount === 2000) return 'randaayiram';
  return `${amount}`;
}

// 10. ODIA (ଓଡ଼ିଆ)
export function formatOdiaAmount(amount: number): string {
  if (amount === 10) return 'ଦଶ';
  if (amount === 20) return 'କୋଡ଼ିଏ';
  if (amount === 25) return 'ପଚିଶ';
  if (amount === 50) return 'ପଚାଶ';
  if (amount === 100) return 'ଏକ ଶହ';
  if (amount === 200) return 'ଦୁଇ ଶହ';
  if (amount === 500) return 'ପାଞ୍ଚ ଶହ';
  if (amount === 1000) return 'ଏକ ହଜାର';
  if (amount === 2000) return 'ଦୁଇ ହଜାର';
  if (amount === 5000) return 'ପାଞ୍ଚ ହଜାର';
  if (amount < 100) return `${amount}`;
  if (amount < 1000) {
    const h = Math.floor(amount / 100);
    const rem = amount % 100;
    const hWords = ['', 'ଏକ ଶହ', 'ଦୁଇ ଶହ', 'ତିନି ଶହ', 'ଚାରି ଶହ', 'ପାଞ୍ଚ ଶହ', 'ଛଅ ଶହ', 'ସାତ ଶହ', 'ଆଠ ଶହ', 'ନଅ ଶହ'];
    const prefix = hWords[h] || `${h} ଶହ`;
    return rem === 0 ? prefix : `${prefix} ${rem}`;
  }
  const th = Math.floor(amount / 1000);
  const rem = amount % 1000;
  return rem === 0 ? `${th} ହଜାର` : `${th} ହଜାର ${formatOdiaAmount(rem)}`;
}

export function formatOdiaPhoneticAmount(amount: number): string {
  if (amount === 10) return 'dasa';
  if (amount === 20) return 'kodiye';
  if (amount === 50) return 'pachasa';
  if (amount === 100) return 'eka saha';
  if (amount === 200) return 'dui saha';
  if (amount === 500) return 'pancha saha';
  if (amount === 1000) return 'eka hajara';
  return `${amount}`;
}

// 11. ASSAMESE (অসমীয়া)
export function formatAssameseAmount(amount: number): string {
  if (amount === 10) return 'দহ';
  if (amount === 20) return 'বিছ';
  if (amount === 25) return 'পঁচিশ';
  if (amount === 50) return 'পঞ্চাশ';
  if (amount === 100) return 'এশ';
  if (amount === 200) return 'দুশ';
  if (amount === 500) return 'পাঁচশ';
  if (amount === 1000) return 'এক হেজাৰ';
  if (amount === 2000) return 'দুই হেজাৰ';
  if (amount === 5000) return 'পাঁচ হেজাৰ';
  if (amount < 1000) {
    const h = Math.floor(amount / 100);
    const rem = amount % 100;
    const hWords = ['', 'এশ', 'দুশ', 'তিনিশ', 'চাৰিশ', 'পাঁচশ', 'ছয়শ', 'সাতশ', 'আঠশ', 'নশ'];
    const prefix = hWords[h] || `${h}শ`;
    return rem === 0 ? prefix : `${prefix} ${rem}`;
  }
  const th = Math.floor(amount / 1000);
  const rem = amount % 1000;
  return rem === 0 ? `${th} হেজাৰ` : `${th} হেজাৰ ${formatAssameseAmount(rem)}`;
}

export function formatAssamesePhoneticAmount(amount: number): string {
  if (amount === 10) return 'doho';
  if (amount === 20) return 'bish';
  if (amount === 50) return 'ponchash';
  if (amount === 100) return 'esho';
  if (amount === 200) return 'dusho';
  if (amount === 500) return 'paanchsho';
  if (amount === 1000) return 'ek hejaar';
  return `${amount}`;
}

// 12. BHOJPURI (भोजपुरी)
export function formatBhojpuriAmount(amount: number): string {
  if (amount === 10) return 'दस';
  if (amount === 20) return 'बीस';
  if (amount === 50) return 'पचास';
  if (amount === 100) return 'एक सौ';
  if (amount === 200) return 'दू सौ';
  if (amount === 500) return 'पाँच सौ';
  if (amount === 1000) return 'एक हजार';
  if (amount === 2000) return 'दू हजार';
  return formatHindiAmount(amount);
}

export function formatBhojpuriPhoneticAmount(amount: number): string {
  if (amount === 10) return 'das';
  if (amount === 20) return 'bees';
  if (amount === 50) return 'pachaas';
  if (amount === 100) return 'ek sau';
  if (amount === 200) return 'doo sau';
  if (amount === 500) return 'paanch sau';
  if (amount === 1000) return 'ek hajaar';
  return formatHindiPhoneticAmount(amount);
}

// 13. RAJASTHANI (राजस्थानी / मारवाड़ी)
export function formatRajasthaniAmount(amount: number): string {
  if (amount === 10) return 'दस';
  if (amount === 20) return 'बीस';
  if (amount === 50) return 'पचास';
  if (amount === 100) return 'एक सौ';
  if (amount === 200) return 'दो सौ';
  if (amount === 500) return 'पाँच सौ';
  if (amount === 1000) return 'एक हजार';
  if (amount === 2000) return 'दो हजार';
  return formatHindiAmount(amount);
}

export function formatRajasthaniPhoneticAmount(amount: number): string {
  if (amount === 10) return 'das';
  if (amount === 20) return 'bees';
  if (amount === 50) return 'pachaas';
  if (amount === 100) return 'ek sau';
  if (amount === 200) return 'do sau';
  if (amount === 500) return 'paanch sau';
  if (amount === 1000) return 'ek hajaar';
  return formatHindiPhoneticAmount(amount);
}

/* =======================================================================
   SPOKEN PHRASE BUILDERS
======================================================================= */

/**
 * Build authentic spoken text for the loudbox alert.
 * Uses spaced tokens so speech synthesis engines pronounce app names and particles clearly.
 */
export function buildSpokenText(
  amount: number,
  appId: UpiAppId,
  langCode: LanguageCode,
  senderName?: string,
  forHindiVoiceFallback = false
): string {
  const cleanSender =
    senderName &&
    senderName.trim().length > 0 &&
    senderName.trim().toLowerCase() !== 'customer' &&
    senderName.trim().toLowerCase() !== 'unknown'
      ? senderName.trim()
      : undefined;

  switch (langCode) {
    case 'mr': {
      // Authentic Marathi Loudbox announcements
      const marathiApps: Record<UpiAppId, string> = {
        gpay: 'गूगल पे वर',
        phonepe: 'फोनपे वर',
        paytm: 'पेटीएम वर',
        bhim: 'भीम वर',
        amazonpay: 'अमेझॉन पे वर',
        cred: 'क्रेड वर',
        mobikwik: 'मोबिक्विक वर',
      };
      const app = marathiApps[appId] || 'यूपीआय वर';
      const words = formatMarathiAmount(amount);
      const ending = forHindiVoiceFallback ? 'रुपये मिलाले' : 'रुपये मिळाले';
      if (cleanSender) {
        return `${app} ${cleanSender} कडून ${words} ${ending}`;
      }
      return `${app} ${words} ${ending}`;
    }

    case 'hi': {
      // Authentic Hindi Loudbox announcements
      const hindiApps: Record<UpiAppId, string> = {
        gpay: 'गूगल पे पर',
        phonepe: 'फ़ोन पे पर',
        paytm: 'पेटीएम पर',
        bhim: 'भीम पर',
        amazonpay: 'अमेज़न पे पर',
        cred: 'क्रेड पर',
        mobikwik: 'मोबिक्विक पर',
      };
      const app = hindiApps[appId] || 'यूपीआई पर';
      const words = formatHindiAmount(amount);
      if (cleanSender) {
        return `${app} ${cleanSender} से ${words} रुपये प्राप्त हुए`;
      }
      return `${app} ${words} रुपये प्राप्त हुए`;
    }

    case 'hinglish': {
      const engApps: Record<UpiAppId, string> = {
        gpay: 'Google Pay',
        phonepe: 'PhonePe',
        paytm: 'Paytm',
        bhim: 'BHIM UPI',
        amazonpay: 'Amazon Pay',
        cred: 'Cred',
        mobikwik: 'MobiKwik',
      };
      const app = engApps[appId] || 'UPI';
      if (cleanSender) {
        return `${app} par ${cleanSender} se ${amount} rupees receive hue`;
      }
      return `${app} par ${amount} rupees receive hue`;
    }

    case 'gu': {
      // Authentic Gujarati Loudbox announcements
      const gujApps: Record<UpiAppId, string> = {
        gpay: 'ગૂગલ પે પર',
        phonepe: 'ફોન પે પર',
        paytm: 'પેટીએમ પર',
        bhim: 'ભીમ પર',
        amazonpay: 'એમેઝોન પે પર',
        cred: 'ક્રેડ પર',
        mobikwik: 'મોબિક્વિંક પર',
      };
      const app = gujApps[appId] || 'યુપીઆઈ પર';
      const words = formatGujaratiAmount(amount);
      if (cleanSender) {
        return `${app} ${cleanSender} તરફથી ${words} રૂપિયા મળ્યા`;
      }
      return `${app} ${words} રૂપિયા મળ્યા`;
    }

    case 'pa': {
      // Authentic Punjabi Loudbox announcements
      const punjApps: Record<UpiAppId, string> = {
        gpay: 'ਗੂਗਲ ਪੇ ਤੇ',
        phonepe: 'ਫੋਨ ਪੇ ਤੇ',
        paytm: 'ਪੇਟੀਐਮ ਤੇ',
        bhim: 'ਭੀਮ ਤੇ',
        amazonpay: 'ਐਮਾਜ਼ੋਨ ਪੇ ਤੇ',
        cred: 'ਕ੍ਰੈਡ ਤੇ',
        mobikwik: 'ਮੋਬੀਕਵਿਕ ਤੇ',
      };
      const app = punjApps[appId] || 'ਯੂਪੀਆਈ ਤੇ';
      const words = formatPunjabiAmount(amount);
      if (cleanSender) {
        return `${app} ${cleanSender} ਵੱਲੋਂ ${words} ਰੁਪਏ ਪ੍ਰਾਪਤ ਹੋਏ`;
      }
      return `${app} ${words} ਰੁਪਏ ਪ੍ਰਾਪਤ ਹੋਏ`;
    }

    case 'bn': {
      // Authentic Bengali Loudbox announcements
      const bengApps: Record<UpiAppId, string> = {
        gpay: 'গুগল পে তে',
        phonepe: 'ফোনপে তে',
        paytm: 'পেটিএম এ',
        bhim: 'ভীম এ',
        amazonpay: 'অ্যামাজন পে তে',
        cred: 'ক্রেড এ',
        mobikwik: 'মোবিকুইক এ',
      };
      const app = bengApps[appId] || 'ইউপিআই তে';
      const words = formatBengaliAmount(amount);
      if (cleanSender) {
        return `${app} ${cleanSender} এর থেকে ${words} টাকা পাওয়া গেছে`;
      }
      return `${app} ${words} টাকা পাওয়া গেছে`;
    }

    case 'ta': {
      // Authentic Tamil Loudbox announcements
      const tamApps: Record<UpiAppId, string> = {
        gpay: 'கூகிள் பே மூலம்',
        phonepe: 'போன்பே மூலம்',
        paytm: 'பேடிஎம் மூலம்',
        bhim: 'பீம் மூலம்',
        amazonpay: 'அமேசான் பே மூலம்',
        cred: 'கிரெட் மூலம்',
        mobikwik: 'மொபிகுவிக் மூலம்',
      };
      const app = tamApps[appId] || 'யூபிஐ மூலம்';
      const words = formatTamilAmount(amount);
      if (cleanSender) {
        return `${app} ${cleanSender} விடம் இருந்து ${words} ரூபாய் பெறப்பட்டது`;
      }
      return `${app} ${words} ரூபாய் பெறப்பட்டது`;
    }

    case 'te': {
      // Authentic Telugu Loudbox announcements
      const telApps: Record<UpiAppId, string> = {
        gpay: 'గూగుల్ పే లో',
        phonepe: 'ఫోన్‌పే లో',
        paytm: 'పేటీఎం లో',
        bhim: 'భీమ్ లో',
        amazonpay: 'అమెజాన్ పే లో',
        cred: 'క్రెడ్ లో',
        mobikwik: 'మోబిక్విక్ లో',
      };
      const app = telApps[appId] || 'యూపీఐ లో';
      const words = formatTeluguAmount(amount);
      if (cleanSender) {
        return `${app} ${cleanSender} నుండి ${words} రూపాయలు అందాయి`;
      }
      return `${app} ${words} రూపాయలు అందాయి`;
    }

    case 'kn': {
      // Authentic Kannada Loudbox announcements
      const kanApps: Record<UpiAppId, string> = {
        gpay: 'ಗೂಗಲ್ ಪೇ ನಲ್ಲಿ',
        phonepe: 'ಫೋನ್ ಪೇ ನಲ್ಲಿ',
        paytm: 'ಪೇಟಿಎಂ ನಲ್ಲಿ',
        bhim: 'ಭೀಮ್ ನಲ್ಲಿ',
        amazonpay: 'ಅಮೆಜಾನ್ ಪೇ ನಲ್ಲಿ',
        cred: 'ಕ್ರೆಡ್ ನಲ್ಲಿ',
        mobikwik: 'ಮೊಬಿಕ್ವಿಕ್ ನಲ್ಲಿ',
      };
      const app = kanApps[appId] || 'ಯುಪಿಐ ನಲ್ಲಿ';
      const words = formatKannadaAmount(amount);
      if (cleanSender) {
        return `${app} ${cleanSender} ಅವರಿಂದ ${words} ರೂಪಾಯಿ ಸ್ವೀಕರಿಸಲಾಗಿದೆ`;
      }
      return `${app} ${words} ರೂಪಾಯಿ ಸ್ವೀಕರಿಸಲಾಗಿದೆ`;
    }

    case 'ml': {
      // Authentic Malayalam Loudbox announcements
      const mlApps: Record<UpiAppId, string> = {
        gpay: 'ഗൂഗിൾ പേ വഴി',
        phonepe: 'ഫോൺപേ വഴി',
        paytm: 'പേടിഎം വഴി',
        bhim: 'ഭീം വഴി',
        amazonpay: 'ആമസോൺ പേ വഴി',
        cred: 'ക്രെഡ് വഴി',
        mobikwik: 'മൊബിക്വിക് വഴി',
      };
      const app = mlApps[appId] || 'യുപിഐ വഴി';
      const words = formatMalayalamAmount(amount);
      if (cleanSender) {
        return `${app} ${cleanSender} ൽ നിന്ന് ${words} രൂപ ലഭിച്ചു`;
      }
      return `${app} ${words} രൂപ ലഭിച്ചു`;
    }

    case 'or': {
      // Authentic Odia Loudbox announcements
      const orApps: Record<UpiAppId, string> = {
        gpay: 'ଗୁଗଲ୍ ପେ ରେ',
        phonepe: 'ଫୋନ୍ ପେ ରେ',
        paytm: 'ପେଟିଏମ୍ ରେ',
        bhim: 'ଭୀମ୍ ରେ',
        amazonpay: 'ଆମାଜନ୍ ପେ ରେ',
        cred: 'କ୍ରେଡ୍ ରେ',
        mobikwik: 'ମୋବିକ୍ୱିକ୍ ରେ',
      };
      const app = orApps[appId] || 'ୟୁପିଆଇ ରେ';
      const words = formatOdiaAmount(amount);
      if (cleanSender) {
        return `${app} ${cleanSender} ଙ୍କ ଠାରୁ ${words} ଟଙ୍କା ମିଳିଲା`;
      }
      return `${app} ${words} ଟଙ୍କା ମିଳିଲା`;
    }

    case 'as': {
      // Authentic Assamese Loudbox announcements
      const asApps: Record<UpiAppId, string> = {
        gpay: 'গুগল পে ত',
        phonepe: 'ফোনপে ত',
        paytm: 'পেটিএম ত',
        bhim: 'ভীম ত',
        amazonpay: 'অ্যামাজন পে ত',
        cred: 'ক্রেড ত',
        mobikwik: 'মোবিকুইক ত',
      };
      const app = asApps[appId] || 'ইউপিআই ত';
      const words = formatAssameseAmount(amount);
      if (cleanSender) {
        return `${app} ${cleanSender} ৰ পৰা ${words} টকা লাভ হ'ল`;
      }
      return `${app} ${words} টকা লাভ হ'ল`;
    }

    case 'bho': {
      // Authentic Bhojpuri Loudbox announcements
      const bhoApps: Record<UpiAppId, string> = {
        gpay: 'गूगल पे पर',
        phonepe: 'फ़ोनपे पर',
        paytm: 'पेटीएम पर',
        bhim: 'भीम पर',
        amazonpay: 'अमेज़न पे पर',
        cred: 'क्रेड पर',
        mobikwik: 'मोबिक्विक पर',
      };
      const app = bhoApps[appId] || 'यूपीआई पर';
      const words = formatBhojpuriAmount(amount);
      if (cleanSender) {
        return `${app} ${cleanSender} से ${words} रुपया मिलल`;
      }
      return `${app} ${words} रुपया मिलल`;
    }

    case 'raj': {
      // Authentic Rajasthani Loudbox announcements
      const rajApps: Record<UpiAppId, string> = {
        gpay: 'गूगल पे माथे',
        phonepe: 'फ़ोनपे माथे',
        paytm: 'पेटीएम माथे',
        bhim: 'भीम माथे',
        amazonpay: 'अमेज़न पे माथे',
        cred: 'क्रेड माथे',
        mobikwik: 'मोबिक्विक माथे',
      };
      const app = rajApps[appId] || 'यूपीआई माथे';
      const words = formatRajasthaniAmount(amount);
      if (cleanSender) {
        return `${app} ${cleanSender} सू ${words} रुपया मिल्या`;
      }
      return `${app} ${words} रुपया मिल्या`;
    }

    case 'en':
    default: {
      const engApps: Record<UpiAppId, string> = {
        gpay: 'Google Pay',
        phonepe: 'PhonePe',
        paytm: 'Paytm',
        bhim: 'BHIM UPI',
        amazonpay: 'Amazon Pay',
        cred: 'Cred',
        mobikwik: 'MobiKwik',
      };
      const app = engApps[appId] || 'UPI';
      if (cleanSender) {
        return `Rupees ${amount} received on ${app} from ${cleanSender}`;
      }
      return `Rupees ${amount} received on ${app}`;
    }
  }
}

/**
 * Build Romanized phonetic text that can be read naturally by ANY standard English or Indian TTS engine
 * when no regional voice pack is installed on the user's OS.
 */
export function buildPhoneticSpokenText(
  amount: number,
  appId: UpiAppId,
  langCode: LanguageCode,
  senderName?: string
): string {
  const engApps: Record<UpiAppId, string> = {
    gpay: 'Google Pay',
    phonepe: 'PhonePe',
    paytm: 'Paytm',
    bhim: 'BHIM UPI',
    amazonpay: 'Amazon Pay',
    cred: 'Cred',
    mobikwik: 'MobiKwik',
  };
  const app = engApps[appId] || 'UPI';
  const cleanSender =
    senderName &&
    senderName.trim().length > 0 &&
    senderName.trim().toLowerCase() !== 'customer' &&
    senderName.trim().toLowerCase() !== 'unknown'
      ? senderName.trim()
      : undefined;

  switch (langCode) {
    case 'mr':
      return cleanSender
        ? `${app} var ${cleanSender} kadun ${formatMarathiPhoneticAmount(amount)} rupaye milale`
        : `${app} var ${formatMarathiPhoneticAmount(amount)} rupaye milale`;

    case 'hi':
      return cleanSender
        ? `${app} par ${cleanSender} se ${formatHindiPhoneticAmount(amount)} rupaye prapt hue`
        : `${app} par ${formatHindiPhoneticAmount(amount)} rupaye prapt hue`;

    case 'hinglish':
      return cleanSender
        ? `${app} par ${cleanSender} se ${amount} rupees receive hue`
        : `${app} par ${amount} rupees receive hue`;

    case 'gu':
      return cleanSender
        ? `${app} par ${cleanSender} taraf thi ${formatGujaratiPhoneticAmount(amount)} rupiya malya`
        : `${app} par ${formatGujaratiPhoneticAmount(amount)} rupiya malya`;

    case 'pa':
      return cleanSender
        ? `${app} te ${cleanSender} vallon ${formatPunjabiPhoneticAmount(amount)} rupaye prapat hoye`
        : `${app} te ${formatPunjabiPhoneticAmount(amount)} rupaye prapat hoye`;

    case 'bn':
      return cleanSender
        ? `${app} e ${cleanSender} er theke ${formatBengaliPhoneticAmount(amount)} taka paowa gechhe`
        : `${app} e ${formatBengaliPhoneticAmount(amount)} taka paowa gechhe`;

    case 'ta':
      return cleanSender
        ? `${app} moolam ${cleanSender} idam irundhu ${formatTamilPhoneticAmount(amount)} roobai perappattadhu`
        : `${app} moolam ${formatTamilPhoneticAmount(amount)} roobai perappattadhu`;

    case 'te':
      return cleanSender
        ? `${app} lo ${cleanSender} nundi ${formatTeluguPhoneticAmount(amount)} roopayalu andaayi`
        : `${app} lo ${formatTeluguPhoneticAmount(amount)} roopayalu andaayi`;

    case 'kn':
      return cleanSender
        ? `${app} nalli ${cleanSender} avarinda ${formatKannadaPhoneticAmount(amount)} roopayi sweekarisalagide`
        : `${app} nalli ${formatKannadaPhoneticAmount(amount)} roopayi sweekarisalagide`;

    case 'ml':
      return cleanSender
        ? `${app} vazhi ${cleanSender} il ninnu ${formatMalayalamPhoneticAmount(amount)} roopa labhichu`
        : `${app} vazhi ${formatMalayalamPhoneticAmount(amount)} roopa labhichu`;

    case 'or':
      return cleanSender
        ? `${app} re ${cleanSender} nka tharu ${formatOdiaPhoneticAmount(amount)} tanka milila`
        : `${app} re ${formatOdiaPhoneticAmount(amount)} tanka milila`;

    case 'as':
      return cleanSender
        ? `${app} t ${cleanSender} r pora ${formatAssamesePhoneticAmount(amount)} toka laabh hol`
        : `${app} t ${formatAssamesePhoneticAmount(amount)} toka laabh hol`;

    case 'bho':
      return cleanSender
        ? `${app} par ${cleanSender} se ${formatBhojpuriPhoneticAmount(amount)} rupaya milal`
        : `${app} par ${formatBhojpuriPhoneticAmount(amount)} rupaya milal`;

    case 'raj':
      return cleanSender
        ? `${app} mathe ${cleanSender} su ${formatRajasthaniPhoneticAmount(amount)} rupya milya`
        : `${app} mathe ${formatRajasthaniPhoneticAmount(amount)} rupya milya`;

    case 'en':
    default:
      return cleanSender
        ? `Rupees ${amount} received on ${app} from ${cleanSender}`
        : `Rupees ${amount} received on ${app}`;
  }
}


/* =======================================================================
   INTELLIGENT SPEECH SYNTHESIS ENGINE
======================================================================= */

export interface VoiceMatchResult {
  voice?: SpeechSynthesisVoice;
  utteranceLang: string;
  textToSpeak: string;
  engineType: 'native' | 'hindi-compat' | 'english-phonetic' | 'default';
  description: string;
}

/**
 * Intelligent voice matching to guarantee pronunciation accuracy:
 * 1. Checks if a native regional voice (e.g. Marathi mr-IN, Gujarati gu-IN, etc.) is installed.
 * 2. If missing, checks for an Indian Devanagari voice (hi-IN) and sets matching lang code to avoid rejection.
 * 3. If no Indian language voices exist on system, seamlessly switches to Romanized phonetic text
 *    so English/standard system voices speak the regional words clearly instead of staying silent.
 */
export function resolveBestVoiceForAlert(
  amount: number,
  appId: UpiAppId,
  langCode: LanguageCode,
  senderName?: string,
  preferredVoiceUri?: string
): VoiceMatchResult {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return {
      utteranceLang: 'en-IN',
      textToSpeak: buildSpokenText(amount, appId, langCode, senderName),
      engineType: 'default',
      description: 'Browser speech synthesis unavailable',
    };
  }

  const voices = window.speechSynthesis.getVoices();
  const langConfig = SUPPORTED_LANGUAGES.find((l) => l.code === langCode) || SUPPORTED_LANGUAGES[0];
  const targetCode = langConfig.voiceLangCode.toLowerCase(); // e.g. 'mr-in', 'hi-in'
  const prefix = targetCode.slice(0, 2); // 'mr', 'hi'

  // If user explicitly picked a preferred voice
  if (preferredVoiceUri) {
    const userVoice = voices.find((v) => v.voiceURI === preferredVoiceUri || v.name === preferredVoiceUri);
    if (userVoice) {
      const isEnglish = userVoice.lang.toLowerCase().startsWith('en');
      return {
        voice: userVoice,
        utteranceLang: userVoice.lang,
        textToSpeak: isEnglish
          ? buildPhoneticSpokenText(amount, appId, langCode)
          : buildSpokenText(amount, appId, langCode, senderName),
        engineType: 'native',
        description: `Custom selected voice: ${userVoice.name}`,
      };
    }
  }

  // 1. Check for exact native regional voice (e.g. Google Marathi, Microsoft Aarohi, mr-IN)
  const exactVoice =
    voices.find((v) => v.lang.toLowerCase() === targetCode) ||
    voices.find((v) => v.lang.toLowerCase().replace('_', '-').startsWith(prefix));

  if (exactVoice) {
    return {
      voice: exactVoice,
      utteranceLang: exactVoice.lang,
      textToSpeak: buildSpokenText(amount, appId, langCode, senderName, false),
      engineType: 'native',
      description: `Native regional voice: ${exactVoice.name} (${exactVoice.lang})`,
    };
  }

  // 2. Check for Hindi Devanagari voice fallback for Marathi (and Gujarati/Punjabi)
  // Both Marathi and Hindi share Devanagari script.
  // CRITICAL: We MUST set utterance.lang = 'hi-IN' so the browser doesn't drop the Hindi voice!
  const hindiVoice =
    voices.find((v) => v.lang.toLowerCase().startsWith('hi')) ||
    voices.find((v) => v.name.toLowerCase().includes('hindi'));

  if (hindiVoice) {
    if (langCode === 'mr') {
      // Use Hindi-compatible Marathi phonetics so the Hindi voice speaks smoothly
      return {
        voice: hindiVoice,
        utteranceLang: 'hi-IN',
        textToSpeak: buildSpokenText(amount, appId, 'mr', senderName, true),
        engineType: 'hindi-compat',
        description: `High-fidelity Devanagari speech via ${hindiVoice.name}`,
      };
    }
    if (langCode === 'hi' || langCode === 'hinglish' || langCode === 'bho' || langCode === 'raj') {
      return {
        voice: hindiVoice,
        utteranceLang: 'hi-IN',
        textToSpeak: buildSpokenText(amount, appId, langCode, senderName),
        engineType: 'native',
        description: `Native Hindi/Devanagari voice: ${hindiVoice.name}`,
      };
    }
  }

  // 2b. Check Bengali voice fallback for Assamese (shares Eastern Nagari script)
  if (langCode === 'as') {
    const bengaliVoice =
      voices.find((v) => v.lang.toLowerCase().startsWith('bn')) ||
      voices.find((v) => v.name.toLowerCase().includes('bengali') || v.name.toLowerCase().includes('bangla'));
    if (bengaliVoice) {
      return {
        voice: bengaliVoice,
        utteranceLang: 'bn-IN',
        textToSpeak: buildSpokenText(amount, appId, 'as', senderName),
        engineType: 'native',
        description: `Eastern Nagari speech via ${bengaliVoice.name}`,
      };
    }
  }

  // 3. Check for Indian English voice (e.g. en-IN)
  const indianEnglishVoice =
    voices.find((v) => v.lang.toLowerCase() === 'en-in' || v.lang.toLowerCase() === 'en_in') ||
    voices.find((v) => v.name.toLowerCase().includes('india') && v.lang.toLowerCase().startsWith('en'));

  if (indianEnglishVoice) {
    return {
      voice: indianEnglishVoice,
      utteranceLang: 'en-IN',
      textToSpeak: buildPhoneticSpokenText(amount, appId, langCode),
      engineType: 'english-phonetic',
      description: `Indian English voice (${indianEnglishVoice.name}) with regional phonetics`,
    };
  }

  // 4. Global system voice fallback:
  // If NO Indian voice exists at all, an English voice cannot read Devanagari or Brahmic scripts.
  // Using phonetic transliteration ensures the words are spoken out loud clearly!
  const fallbackVoice = voices.find((v) => v.default) || voices[0];
  const isEnglishOrGeneric =
    !fallbackVoice ||
    fallbackVoice.lang.toLowerCase().startsWith('en') ||
    fallbackVoice.lang === '';

  return {
    voice: fallbackVoice,
    utteranceLang: fallbackVoice ? fallbackVoice.lang : 'en-US',
    textToSpeak: isEnglishOrGeneric
      ? buildPhoneticSpokenText(amount, appId, langCode)
      : buildSpokenText(amount, appId, langCode, senderName),
    engineType: isEnglishOrGeneric ? 'english-phonetic' : 'default',
    description: fallbackVoice
      ? `System voice: ${fallbackVoice.name}`
      : 'Default speech engine with phonetic guidance',
  };
}

// Client-side cache for decoded Web Audio buffers to achieve zero-latency replay
const decodedAudioBufferCache = new Map<string, AudioBuffer>();

/**
 * Play crystal-clear high-fidelity regional voice stream from backend proxy
 * Delivers authentic celebrity voice synthesis via Gemini TTS (e.g. Fenrir, Puck, Zephyr, Aoede)
 * Uses Web Audio API buffer playback so it is never blocked by mobile browser autoplay restrictions.
 */
export async function playHighFidelityVoice(
  text: string,
  lang: string,
  volume = 1.0,
  rate = 1.0,
  personaId?: string,
  voiceName?: string,
  voiceStyle?: string,
  gender?: 'male' | 'female'
): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  const cleanText = text.trim();
  const selectedVoice = voiceName || (gender === 'female' ? 'Aoede' : 'Fenrir');
  const cacheKey = `${personaId || selectedVoice}_${lang}_${cleanText}`;

  // Method 1: Web Audio API Buffer Playback (Bypasses HTML5 Media Autoplay restrictions)
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      await ctx.resume().catch(() => {});
    }

    let audioBuffer = decodedAudioBufferCache.get(cacheKey);

    if (!audioBuffer) {
      const params = new URLSearchParams({
        text: cleanText,
        lang,
        voiceName: selectedVoice,
        personaId: personaId || '',
        style: voiceStyle || '',
        gender: gender || 'male',
      });

      const response = await fetch(`/api/tts?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`TTS server responded with ${response.status}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      audioBuffer = await ctx.decodeAudioData(arrayBuffer);
      decodedAudioBufferCache.set(cacheKey, audioBuffer);
    }

    if (audioBuffer) {
      return new Promise<boolean>((resolve) => {
        try {
          const source = ctx.createBufferSource();
          source.buffer = audioBuffer;
          source.playbackRate.value = Math.max(0.75, Math.min(1.5, rate));

          const gainNode = ctx.createGain();
          gainNode.gain.setValueAtTime(Math.max(0.1, Math.min(1.0, volume)), ctx.currentTime);

          if (gender === 'male' && rate <= 1.05) {
            const lowShelf = ctx.createBiquadFilter();
            lowShelf.type = 'lowshelf';
            lowShelf.frequency.value = 220;
            lowShelf.gain.value = 4.5; // +4.5dB warm male chest resonance
            source.connect(lowShelf);
            lowShelf.connect(gainNode);
          } else {
            source.connect(gainNode);
          }
          gainNode.connect(ctx.destination);

          source.onended = () => {
            resolve(true);
          };

          source.start(0);
        } catch (err) {
          console.warn('Web Audio source node playback failed:', err);
          resolve(false);
        }
      });
    }
  } catch (webAudioErr) {
    console.warn('Web Audio buffer fetch/decode failed, trying HTML5 Audio fallback:', webAudioErr);
  }

  // Method 2: HTML5 Audio fallback
  return new Promise((resolve) => {
    try {
      const params = new URLSearchParams({
        text: cleanText,
        lang,
        voiceName: selectedVoice,
        personaId: personaId || '',
        style: voiceStyle || '',
        gender: gender || 'male',
      });
      const audio = new Audio(`/api/tts?${params.toString()}`);
      audio.volume = Math.max(0.1, Math.min(1.0, volume));
      audio.playbackRate = Math.max(0.75, Math.min(1.5, rate));

      let resolved = false;
      const timer = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          audio.pause();
          resolve(false);
        }
      }, 9000);

      audio.onended = () => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timer);
          resolve(true);
        }
      };

      audio.onerror = () => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timer);
          resolve(false);
        }
      };

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          if (!resolved) {
            resolved = true;
            clearTimeout(timer);
            resolve(false);
          }
        });
      }
    } catch {
      resolve(false);
    }
  });
}

export function getCleanAppName(appId: UpiAppId): string {
  const map: Record<UpiAppId, string> = {
    gpay: 'Google Pay',
    phonepe: 'PhonePe',
    paytm: 'Paytm',
    bhim: 'BHIM',
    amazonpay: 'Amazon Pay',
    cred: 'CRED',
    mobikwik: 'MobiKwik',
  };
  return map[appId] || 'UPI';
}

export function getAmountInWordsForLang(amount: number, langCode: LanguageCode): string {
  switch (langCode) {
    case 'mr':
      return formatMarathiAmount(amount);
    case 'hi':
    case 'hinglish':
      return formatHindiAmount(amount);
    case 'gu':
      return formatGujaratiAmount(amount);
    case 'pa':
      return formatPunjabiAmount(amount);
    case 'ta':
      return formatTamilAmount(amount);
    case 'te':
      return formatTeluguAmount(amount);
    case 'kn':
      return formatKannadaAmount(amount);
    case 'bn':
      return formatBengaliAmount(amount);
    case 'ml':
      return formatMalayalamAmount(amount);
    case 'or':
      return formatOdiaAmount(amount);
    case 'as':
      return formatAssameseAmount(amount);
    case 'bho':
      return formatBhojpuriAmount(amount);
    case 'raj':
      return formatRajasthaniAmount(amount);
    default:
      return `${amount}`;
  }
}

/**
 * Announce payment alert with signature Chime / Celebrity Audio Sting + Celebrity Voice
 */
export async function announcePaymentAlert(
  amount: number,
  appId: UpiAppId,
  settings: AudioSettings,
  senderName?: string,
  onSpeechStateChange?: (speaking: boolean) => void,
  onAnnouncementText?: (text: string | null) => void
): Promise<void> {
  const persona = getPersonaById(settings.voicePersonaId);
  const lang = persona ? persona.languageCode : settings.selectedLanguage;
  const appLabel = getCleanAppName(appId);
  const amountWords = getAmountInWordsForLang(amount, lang);

  // Check ON/OFF setting for sender-name announcements
  const effectiveSenderName =
    settings.announceSenderName !== false &&
    senderName &&
    senderName.trim().length > 0 &&
    senderName.trim().toLowerCase() !== 'customer' &&
    senderName.trim().toLowerCase() !== 'unknown'
      ? senderName.trim()
      : undefined;

  let displaySubtitle = '';
  let fullSpokenText = '';
  let phoneticGuide = '';
  let speechRate = settings.rate;
  let speechPitch = settings.pitch;

  if (persona) {
    const alertData = persona.buildAlert(amount, appLabel, amountWords, effectiveSenderName);
    displaySubtitle = alertData.displayBanner;
    fullSpokenText = alertData.fullSpeechText;
    phoneticGuide = alertData.phoneticText;
    speechRate = Math.max(0.75, Math.min(1.4, settings.rate * persona.speechRate));
    speechPitch = Math.max(0.6, Math.min(1.4, settings.pitch * persona.speechPitch));
  } else {
    displaySubtitle = buildSpokenText(amount, appId, settings.selectedLanguage, effectiveSenderName, false);
    fullSpokenText = displaySubtitle;
    phoneticGuide = buildPhoneticSpokenText(amount, appId, settings.selectedLanguage, effectiveSenderName);
  }


  onSpeechStateChange?.(true);
  onAnnouncementText?.(displaySubtitle);

  // Step 1: Play either the Celebrity Signature Sting or the Selected Chime
  if (persona && persona.audioSting) {
    await playCelebritySting(persona.audioSting, settings.volume);
  } else {
    await playLoudboxChime(settings.chimeStyle, settings.volume);
  }

  // Step 2: Try High-Fidelity Studio-Quality Native Voice Stream first with exact Celebrity persona
  const ttsLang = persona
    ? persona.languageCode
    : settings.selectedLanguage === 'hinglish'
    ? 'hi'
    : settings.selectedLanguage;

  const playedNativeStream = await playHighFidelityVoice(
    fullSpokenText,
    ttsLang,
    settings.volume,
    speechRate,
    persona?.id,
    persona?.geminiVoice,
    persona?.voiceStyle,
    persona?.gender
  );

  if (playedNativeStream) {
    onSpeechStateChange?.(false);
    onAnnouncementText?.(null);
    return;
  }

  // Step 3: Offline fallback to local SpeechSynthesis if network was unavailable
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    setTimeout(() => {
      onSpeechStateChange?.(false);
      onAnnouncementText?.(null);
    }, 2000);
    return;
  }

  // Cancel any lingering utterance
  window.speechSynthesis.cancel();

  // Resolve best voice and text
  const match = resolveBestVoiceForAlert(
    amount,
    appId,
    lang,
    effectiveSenderName,
    settings.preferredVoiceUri
  );


  let finalSpokenText = fullSpokenText;
  if (settings.voiceMode === 'phonetic') {
    finalSpokenText = phoneticGuide;
  }

  const utterance = new SpeechSynthesisUtterance(finalSpokenText);
  utterance.rate = speechRate;
  utterance.pitch = speechPitch;
  utterance.volume = settings.volume;
  utterance.lang = match.utteranceLang;

  if (match.voice) {
    utterance.voice = match.voice;
  }

  return new Promise((resolve) => {
    let resolved = false;

    // Safety timeout in case speech engine hangs
    const timer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        onSpeechStateChange?.(false);
        onAnnouncementText?.(null);
        resolve();
      }
    }, 8000);

    utterance.onend = () => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timer);
        onSpeechStateChange?.(false);
        onAnnouncementText?.(null);
        resolve();
      }
    };

    utterance.onerror = (e) => {
      console.warn('Speech synthesis alert error:', e);
      if (!resolved) {
        resolved = true;
        clearTimeout(timer);
        onSpeechStateChange?.(false);
        onAnnouncementText?.(null);
        resolve();
      }
    };

    window.speechSynthesis.speak(utterance);
  });
}

/**
 * Play an instant preview for a specific language without necessarily persisting
 */
export async function playLanguageSample(
  langCode: LanguageCode,
  settings: AudioSettings,
  onSpeechStateChange?: (speaking: boolean) => void,
  customAmount = 500,
  appId: UpiAppId = 'paytm'
): Promise<void> {
  const tempSettings: AudioSettings = {
    ...settings,
    selectedLanguage: langCode,
  };
  return announcePaymentAlert(customAmount, appId, tempSettings, 'Sample', onSpeechStateChange);
}

/**
 * Get all available browser voices for user diagnostics and selection
 */
export function getAvailableVoices(): SpeechSynthesisVoice[] {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return [];
  }
  return window.speechSynthesis.getVoices();
}
