import React, { useState } from 'react';
import { 
  Volume2, 
  Play, 
  Star, 
  Check, 
  ChevronDown, 
  Smartphone, 
  ShieldCheck, 
  ExternalLink, 
  Store, 
  Languages, 
  TrendingUp, 
  QrCode,
  Zap,
  ArrowRight,
  Sun,
  Moon,
  Sparkles
} from 'lucide-react';
import { AudioSettings, announcePaymentAlert, SUPPORTED_LANGUAGES, playLoudboxChime } from '../utils/audioEngine';

interface LandingPageProps {
  onOpenAndroidApp: () => void;
  audioSettings: AudioSettings;
  setAudioSettings: React.Dispatch<React.SetStateAction<AudioSettings>>;
  isSpeaking: boolean;
  setIsSpeaking: (speaking: boolean) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onOpenAndroidApp,
  audioSettings,
  setAudioSettings,
  isSpeaking,
  setIsSpeaking,
}) => {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [selectedDemoTab, setSelectedDemoTab] = useState<'Daily' | 'Weekly' | 'Monthly'>('Daily');
  const [activeLangCard, setActiveLangCard] = useState<string>('hi');

  const faqs = [
    {
      q: 'How does Loudbox work for UPI payment alerts?',
      a: 'Loudbox links with your UPI apps and announces payments instantly through voice alerts. Just install the app on your Android phone, enable notification access, and start getting real-time audio announcements for every incoming payment.',
    },
    {
      q: 'Which languages are available for voice notifications and app display?',
      a: 'Loudbox supports 15 Indian languages: Marathi, Hindi, English, Hinglish, Gujarati, Punjabi, Tamil, Telugu, Kannada, Bengali, Malayalam, Odia, Assamese, Bhojpuri, and Rajasthani. You can choose both your App Display Language and your Voice Announcement Language during the first setup or switch anytime from settings.',
    },
    {
      q: 'Is my payment information safe with Loudbox?',
      a: 'Yes. Loudbox operates locally on your phone and follows strict security standards. Your financial information stays private on your handset and is never stored, sold, or shared with third parties.',
    },
    {
      q: 'What happens if I miss a voice alert?',
      a: 'No worries. Every payment is logged in your transaction history. You can check records anytime, replay voice alerts, filter by date, and review daily, weekly, or monthly collections easily.',
    },
  ];

  const handleTestVoice = (langCode: string) => {
    setActiveLangCard(langCode);
    const updatedSettings = { ...audioSettings, selectedLanguage: langCode as any };
    setAudioSettings(updatedSettings);
    announcePaymentAlert(500, 'gpay', updatedSettings, 'Customer', setIsSpeaking);
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-[#09090b] text-zinc-100' : 'bg-[#f4f4f4] text-zinc-900'} transition-colors duration-300 font-sans selection:bg-purple-600 selection:text-white`}>
      {/* Sticky Header matching loudbox.in */}
      <header className={`sticky top-0 z-50 backdrop-blur-xl border-b ${
        isDarkMode ? 'bg-zinc-950/85 border-zinc-800/80' : 'bg-white/85 border-zinc-200'
      }`}>
        <div className="max-w-6xl mx-auto px-4 h-20 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-600 flex items-center justify-center shadow-lg shadow-purple-600/30 text-white font-black text-lg">
              ₹
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-purple-500 to-indigo-500 bg-clip-text text-transparent">
                Loudbox
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-600/10 text-purple-400 border border-purple-500/20">
                UPI Mobile Alerts
              </span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-zinc-400">
            <a href="#about" className="hover:text-purple-400 transition">Who is it for</a>
            <a href="#features" className="hover:text-purple-400 transition">Features</a>
            <a href="#reviews" className="hover:text-purple-400 transition">Reviews</a>
            <a href="#faq" className="hover:text-purple-400 transition">FAQ</a>
          </nav>

          {/* Header Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`p-2.5 rounded-xl border transition cursor-pointer ${
                isDarkMode 
                  ? 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white' 
                  : 'bg-zinc-100 border-zinc-300 text-zinc-700 hover:text-zinc-900'
              }`}
              title="Toggle Theme"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-purple-600" />}
            </button>

            <button
              onClick={onOpenAndroidApp}
              className="py-2.5 px-5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm shadow-lg shadow-purple-600/30 flex items-center gap-2 transition active:scale-95 cursor-pointer"
            >
              <Smartphone className="w-4 h-4" />
              <span>Open Android App</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-12 pb-20 px-4 overflow-hidden">
        {/* Ambient background glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 bg-purple-600/15 blur-[120px] rounded-full pointer-events-none"></div>

        <div className="max-w-5xl mx-auto flex flex-col items-center text-center relative z-10">
          {/* Introducing Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-600/15 border border-purple-500/30 text-purple-400 text-xs font-bold uppercase tracking-wider mb-6">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>Introducing</span>
          </div>

          {/* Main Hero Title */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight max-w-4xl leading-[1.1] mb-6">
            All-in-One Mobile <br />
            <span className="bg-gradient-to-r from-purple-400 via-purple-300 to-indigo-400 bg-clip-text text-transparent">
              UPI Loudbox
            </span>
          </h1>

          {/* Hero Subtitle */}
          <p className="text-lg sm:text-xl text-zinc-400 max-w-2xl font-normal leading-relaxed mb-8">
            Get voice alerts the moment you receive money via GPay, PhonePe, Paytm, Amazon Pay & others. No hardware needed.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4 mb-10">
            <button
              onClick={onOpenAndroidApp}
              className="py-3.5 px-8 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-base shadow-xl shadow-purple-600/30 flex items-center gap-2.5 transition active:scale-95 cursor-pointer"
            >
              <Smartphone className="w-5 h-5" />
              <span>Launch Loudbox App</span>
            </button>

            <button
              onClick={() => handleTestVoice(audioSettings.selectedLanguage)}
              className={`py-3.5 px-6 rounded-2xl border font-bold text-sm flex items-center gap-2 transition active:scale-95 cursor-pointer ${
                isDarkMode 
                  ? 'bg-zinc-900/80 hover:bg-zinc-800 border-zinc-800 text-purple-300' 
                  : 'bg-white hover:bg-zinc-50 border-zinc-300 text-purple-700'
              }`}
            >
              <Volume2 className="w-4 h-4 text-purple-400" />
              <span>Hear Sample Alert Voice</span>
            </button>
          </div>

          {/* Stats Bar */}
          <div className="flex items-center justify-center divide-x divide-zinc-800 border border-zinc-800 rounded-3xl bg-zinc-900/50 backdrop-blur-md px-6 py-4 mb-8 text-center max-w-md w-full">
            <div className="flex-1 px-3">
              <div className="text-2xl font-black text-white">10M+</div>
              <div className="text-xs text-zinc-400">Downloads</div>
            </div>
            <div className="flex-1 px-3">
              <div className="text-2xl font-black text-white flex items-center justify-center gap-1">
                4.5 <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              </div>
              <div className="text-xs text-zinc-400">Rating</div>
            </div>
            <div className="flex-1 px-3">
              <div className="text-2xl font-black text-white">50K+</div>
              <div className="text-xs text-zinc-400">Reviews</div>
            </div>
          </div>

          {/* Trust Banner */}
          <p className="text-sm text-zinc-400 font-medium">
            Trusted by <span className="font-bold text-purple-400">1 crore+</span> merchants and shopkeepers!
          </p>

          {/* Floating Payment Notification Badges matching loudbox.in */}
          <div className="mt-12 w-full grid grid-cols-2 sm:grid-cols-5 gap-3 max-w-4xl">
            {[
              { app: 'Google Pay', val: '+ ₹650', badge: 'G', color: 'bg-blue-600' },
              { app: 'PhonePe', val: '+ ₹420', badge: 'Ph', color: 'bg-purple-600' },
              { app: 'BHIM UPI', val: '+ ₹275', badge: 'B', color: 'bg-emerald-600' },
              { app: 'Paytm', val: '+ ₹540', badge: 'P', color: 'bg-cyan-600' },
              { app: 'MobiKwik', val: '+ ₹310', badge: 'M', color: 'bg-sky-600' },
            ].map((card, idx) => (
              <div
                key={idx}
                onClick={() => {
                  const num = parseInt(card.val.replace(/[^0-9]/g, ''));
                  announcePaymentAlert(num, (card.badge === 'G' ? 'gpay' : card.badge === 'Ph' ? 'phonepe' : card.badge === 'B' ? 'bhim' : 'paytm') as any, audioSettings, 'Customer', setIsSpeaking);
                }}
                className={`p-3 rounded-2xl border text-left flex items-center gap-2.5 transition transform hover:-translate-y-1 shadow-md cursor-pointer ${
                  isDarkMode ? 'bg-zinc-900/90 border-zinc-800 hover:border-purple-500/40' : 'bg-white border-zinc-200 hover:border-purple-300'
                }`}
              >
                <div className={`w-8 h-8 rounded-xl ${card.color} text-white font-black text-xs flex items-center justify-center shrink-0`}>
                  {card.badge}
                </div>
                <div className="overflow-hidden">
                  <div className="text-[11px] text-zinc-400 font-medium truncate">{card.app}</div>
                  <div className="text-xs font-black font-mono text-emerald-400">{card.val}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* "Who is it for" Section (#about) */}
      <section id="about" className="py-20 px-4 border-t border-zinc-800/60">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="px-3.5 py-1.5 rounded-full bg-purple-600/15 border border-purple-500/30 text-purple-400 text-xs font-bold uppercase tracking-wider mb-3 inline-block">
              Who is it for
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-2">
              Who Can Use Loudbox?
            </h2>
            <p className="text-zinc-400 text-base mt-3">
              Built for all kinds of businesses across India that accept UPI payments.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: 'Street Vendors & Food Stalls',
                desc: 'Ideal for kiosks, tea points, and food carts that need instant voice confirmation for every payment without checking their phone.',
                icon: '🏪',
                featured: false,
              },
              {
                title: 'Local Service Businesses',
                desc: 'Salons, barbers, tailors, and repair shops that collect frequent UPI payments while working hands-on with customers.',
                icon: '💇',
                featured: true,
              },
              {
                title: 'Home-Based Sellers',
                desc: 'Great for tiffin services, home bakers, and small online boutiques handling multiple daily UPI transfers.',
                icon: '🍱',
                featured: false,
              },
              {
                title: 'On-the-Go Professionals',
                desc: 'Electricians, plumbers, and technicians who need hands-free payment confirmation right on the job.',
                icon: '🔧',
                featured: false,
              },
              {
                title: 'Retail & Medical Stores',
                desc: 'Perfect for kirana and pharmacy counters that want reliable alerts and daily collection summaries without extra hardware rentals.',
                icon: '💊',
                featured: false,
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className={`p-6 rounded-3xl border transition relative flex flex-col justify-between ${
                  item.featured
                    ? isDarkMode 
                      ? 'bg-gradient-to-b from-purple-950/40 to-zinc-900 border-purple-500/50 shadow-xl' 
                      : 'bg-purple-50/60 border-purple-300 shadow-md'
                    : isDarkMode 
                      ? 'bg-zinc-900/60 border-zinc-800/80 hover:border-zinc-700' 
                      : 'bg-white border-zinc-200'
                }`}
              >
                <div>
                  <div className="text-4xl mb-4">{item.icon}</div>
                  <h3 className="font-bold text-lg mb-2 text-white">{item.title}</h3>
                  <p className="text-sm text-zinc-400 leading-relaxed">{item.desc}</p>
                </div>
                {item.featured && (
                  <span className="mt-4 inline-block self-start px-2.5 py-1 rounded-full bg-purple-600/20 text-purple-400 font-bold text-[10px] uppercase tracking-wider">
                    Most Popular
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* "Powerful Features for Indian Merchants" Section (#features) */}
      <section id="features" className="py-20 px-4 border-t border-zinc-800/60 bg-zinc-950/40">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="px-3.5 py-1.5 rounded-full bg-purple-600/15 border border-purple-500/30 text-purple-400 text-xs font-bold uppercase tracking-wider mb-3 inline-block">
              Features
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-2">
              Powerful Features for Indian Merchants
            </h2>
            <p className="text-zinc-400 text-base mt-3">
              Everything your store needs to accept and track UPI payments smoothly.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Feature 1: Compatible with Leading UPI Apps */}
            <div className={`p-6 rounded-3xl border flex flex-col justify-between ${
              isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
            }`}>
              <div>
                <h3 className="font-bold text-xl mb-2 text-white">Compatible with Leading UPI Apps</h3>
                <p className="text-sm text-zinc-400 mb-6">
                  Get instant voice alerts for Google Pay, PhonePe, Paytm, BHIM, and more.
                </p>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { name: 'G Pay', badge: 'G', bg: 'bg-blue-600' },
                    { name: 'BHIM', badge: 'B', bg: 'bg-emerald-600' },
                    { name: 'Paytm', badge: 'P', bg: 'bg-cyan-600' },
                    { name: 'MobiKwik', badge: 'M', bg: 'bg-sky-600' },
                    { name: 'Freecharge', badge: 'F', bg: 'bg-orange-600' },
                    { name: 'PhonePe', badge: 'Ph', bg: 'bg-purple-600' },
                  ].map((app, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-2xl bg-zinc-950/60 border border-zinc-800 flex flex-col items-center justify-center gap-1 text-center"
                    >
                      <div className={`w-8 h-8 rounded-xl ${app.bg} text-white font-black text-xs flex items-center justify-center`}>
                        {app.badge}
                      </div>
                      <span className="text-xs font-medium text-zinc-300">{app.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Feature 2: Multi-Language Voice Alerts (Interactive!) */}
            <div className={`p-6 rounded-3xl border flex flex-col justify-between relative overflow-hidden ${
              isDarkMode ? 'bg-gradient-to-b from-purple-950/30 to-zinc-900 border-purple-500/40 shadow-xl' : 'bg-purple-50/50 border-purple-300'
            }`}>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-xl text-white">Multi-Language Voice Alerts</h3>
                  <span className="px-2 py-0.5 rounded-full bg-purple-600 text-white text-[10px] font-bold">Interactive</span>
                </div>
                <p className="text-sm text-zinc-400 mb-4">
                  Click any language to hear instant payment confirmation in that tongue:
                </p>

                <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
                  {SUPPORTED_LANGUAGES.map((lang) => {
                    const isCurrent = activeLangCard === lang.code;
                    return (
                      <button
                        key={lang.code}
                        onClick={() => handleTestVoice(lang.code)}
                        className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition cursor-pointer ${
                          isCurrent
                            ? 'bg-purple-600 text-white border-purple-500 shadow-md'
                            : 'bg-zinc-950/60 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                        }`}
                      >
                        <div>
                          <div className="font-bold text-xs">{lang.nativeName}</div>
                          <div className="text-[10px] text-zinc-400">{lang.name}</div>
                        </div>
                        <Play className="w-3 h-3 fill-current opacity-80 shrink-0 ml-1" />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Feature 3: Daily, Weekly, and Monthly Collections */}
            <div className={`p-6 rounded-3xl border flex flex-col justify-between ${
              isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
            }`}>
              <div>
                <h3 className="font-bold text-xl mb-2 text-white">Daily, Weekly & Monthly Collections</h3>
                <p className="text-sm text-zinc-400 mb-4">
                  Monitor incoming UPI payments by day, week, month, or custom date range.
                </p>

                {/* Simulated Collection Card */}
                <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800 text-left">
                  <div className="flex justify-between items-center text-xs text-zinc-400 mb-1">
                    <span>14 July 2025</span>
                    <span className="text-emerald-400 font-semibold font-mono">Today's Collection</span>
                  </div>
                  <div className="text-3xl font-black font-mono text-emerald-400 mb-3">
                    ₹6,240
                  </div>
                  <div className="space-y-1.5 border-t border-zinc-800 pt-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-zinc-300">Anil Kirana</span>
                      <span className="font-mono font-bold text-emerald-400">+ ₹1,850</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-300">Neha Pharma</span>
                      <span className="font-mono font-bold text-emerald-400">+ ₹320</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-300">Fresh Mart</span>
                      <span className="font-mono font-bold text-emerald-400">+ ₹960</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Reviews / Testimonials Section (#reviews) */}
      <section id="reviews" className="py-20 px-4 border-t border-zinc-800/60">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="px-3.5 py-1.5 rounded-full bg-purple-600/15 border border-purple-500/30 text-purple-400 text-xs font-bold uppercase tracking-wider mb-3 inline-block">
              Reviews
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-2">
              What Merchants Say About Loudbox
            </h2>
            <p className="text-zinc-400 text-base mt-3">
              Real feedback from store owners using Loudbox every day.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                text: 'বাংলায় ভয়েস এলার্ট থাকায় পেমেন্ট কনফার্ম করতে খুব সুবিধা হয়, গ্রাহকরাও দ্রুত বুঝে যান।',
                name: 'Riya Basu',
                role: 'Basu Book House, Kolkata',
              },
              {
                text: 'Daily collection tracking gives me a clear sales snapshot and helps me reconcile faster every evening.',
                name: 'Kavya Mehta',
                role: 'Mehta Fabrics, Ahmedabad',
              },
              {
                text: 'यह ऐप लगाने के बाद कोई भी UPI पेमेंट मिस नहीं होता, और आवाज अलर्ट बहुत साफ आता है।',
                name: 'Nitin Verma',
                role: 'Verma Stationers, Delhi',
              },
              {
                text: 'This app transformed our billing counter flow. Every UPI payment is announced instantly and clearly.',
                name: 'Pooja Arora',
                role: 'Arora Fresh Mart, Mumbai',
              },
              {
                text: 'ಕನ್ನಡ ವಾಯ್ಸ್ ಅಲರ್ಟ್ ತುಂಬಾ ಉಪಯೋಗವಾಗಿದೆ. ಫೋನ್ ನೋಡದೇ ಗ್ರಾಹಕರ ಮೇಲೆ ಗಮನ ಕೊಡಬಹುದು.',
                name: 'Raghavendra Nayak',
                role: 'Nayak Mobiles, Bengaluru',
              },
              {
                text: 'தமிழ் voice alert ரொம்ப clear-ஆ இருக்கு; payment வந்ததும் கடையில் உடனே தெரிஞ்சிடும்.',
                name: 'Arun Prakash',
                role: 'Prakash Electronics, Chennai',
              },
            ].map((review, idx) => (
              <div
                key={idx}
                className={`p-6 rounded-3xl border flex flex-col justify-between ${
                  isDarkMode ? 'bg-zinc-900/70 border-zinc-800' : 'bg-white border-zinc-200'
                }`}
              >
                <div className="flex items-center gap-1 mb-4 text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-zinc-300 leading-relaxed mb-4 italic">
                  "{review.text}"
                </p>
                <div className="border-t border-zinc-800/80 pt-3">
                  <div className="font-bold text-sm text-white">{review.name}</div>
                  <div className="text-xs text-zinc-400">{review.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section (#faq) */}
      <section id="faq" className="py-20 px-4 border-t border-zinc-800/60 bg-zinc-950/40">
        <div className="max-w-4xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="px-3.5 py-1.5 rounded-full bg-purple-600/15 border border-purple-500/30 text-purple-400 text-xs font-bold uppercase tracking-wider mb-3 inline-block">
              FAQ
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-2">
              Frequently Asked Questions
            </h2>
            <p className="text-zinc-400 text-base mt-3">
              Quick answers to common questions about using Loudbox.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className={`border rounded-2xl transition overflow-hidden ${
                    isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
                  }`}
                >
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full p-5 text-left flex items-center justify-between font-bold text-base text-white cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown className={`w-5 h-5 text-purple-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 text-sm text-zinc-400 leading-relaxed border-t border-zinc-800/60 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer CTA & Links */}
      <footer className="border-t border-zinc-800 bg-zinc-950 py-16 px-4">
        <div className="max-w-6xl mx-auto flex flex-col gap-12">
          {/* Big CTA Banner */}
          <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-purple-900/60 via-purple-800/40 to-indigo-900/60 border border-purple-500/30 flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
            <div>
              <span className="text-xs uppercase tracking-widest font-bold text-purple-300">Let's start now</span>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
                Join merchants across India using Loudbox
              </h3>
              <p className="text-sm text-purple-200/80 mt-1">
                Turn your Android phone into an instant voice payment announcer today.
              </p>
            </div>
            <button
              onClick={onOpenAndroidApp}
              className="py-3.5 px-8 rounded-2xl bg-white hover:bg-zinc-100 text-purple-950 font-black text-sm shadow-xl shrink-0 cursor-pointer transition active:scale-95"
            >
              Get Started Free
            </button>
          </div>

          {/* Footer Columns */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-sm">
            <div>
              <h4 className="font-bold text-white mb-3">UPI Alerts</h4>
              <ul className="space-y-2 text-zinc-400 text-xs">
                <li>Google Pay Alerts</li>
                <li>PhonePe Alerts</li>
                <li>Paytm Alerts</li>
                <li>BHIM UPI</li>
                <li>Amazon Pay Alerts</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-3">Shops</h4>
              <ul className="space-y-2 text-zinc-400 text-xs">
                <li>Kirana Stores</li>
                <li>Street Vendors</li>
                <li>Salons & Tailors</li>
                <li>Home Sellers</li>
                <li>Electricians & Plumbers</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-3">Languages</h4>
              <ul className="space-y-2 text-zinc-400 text-xs">
                <li>Hindi Voice Alerts</li>
                <li>English Announcements</li>
                <li>10 Indian Regional Languages</li>
                <li>Daily Collections Tracker</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-3">About Loudbox</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Loudbox is India's leading UPI payment notification platform for small businesses and merchants. Developed by RAHSOU SIMPLE VIRAL GAMES PRIVATE LIMITED.
              </p>
              <p className="text-xs text-zinc-500 mt-2 font-mono">care@loudbox.in</p>
            </div>
          </div>

          {/* Copyright */}
          <div className="border-t border-zinc-900 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-500 gap-2">
            <span>© 2026 Loudbox (RAHSOU SIMPLE VIRAL GAMES PVT LTD). All rights reserved.</span>
            <span>All-in-One Mobile UPI Loudbox for Android</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
