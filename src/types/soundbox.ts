import { UpiAppId, LanguageCode } from '../utils/audioEngine';

export interface Transaction {
  id: string;
  amount: number;
  customerName: string;
  upiApp: UpiAppId;
  time: string; // ISO string or relative time
  timestamp: number;
  utrNumber: string;
  status: 'SUCCESS' | 'PENDING' | 'FAILED';
  note?: string;
  vpa?: string;
}

export interface MerchantProfile {
  businessName: string;
  ownerName: string;
  upiId: string;
  phone: string;
  category: string;
  city: string;
  verified: boolean;
}

export interface NotificationRule {
  appId: UpiAppId;
  appName: string;
  enabled: boolean;
  color: string;
  accentBg: string;
  brandIconLetter: string;
  detectedKeyword: string;
}

export const DEFAULT_MERCHANT: MerchantProfile = {
  businessName: 'Prasad General Store',
  ownerName: 'Ram Prasad Sharma',
  upiId: 'prasadstore@okaxis',
  phone: '+91 98765 43210',
  category: 'Kirana & General Store',
  city: 'Bengaluru, Karnataka',
  verified: true,
};

function generateInitialTransactions(): Transaction[] {
  const now = Date.now();
  const ONE_HOUR = 60 * 60 * 1000;
  const ONE_DAY = 24 * ONE_HOUR;

  const baseToday: Transaction[] = [
    {
      id: 'tx-101',
      amount: 1850,
      customerName: 'Aarav Retail',
      upiApp: 'gpay',
      time: '12 mins ago',
      timestamp: now - 12 * 60 * 1000,
      utrNumber: '412890562341',
      status: 'SUCCESS',
      vpa: 'aarav.retail@okhdfcbank',
      note: 'Wholesale spices & grains',
    },
    {
      id: 'tx-102',
      amount: 320,
      customerName: 'Neha Pharmacy',
      upiApp: 'phonepe',
      time: '15 mins ago',
      timestamp: now - 15 * 60 * 1000,
      utrNumber: '412890562309',
      status: 'SUCCESS',
      vpa: 'neha.pharma@ybl',
      note: 'Counter medicine bill',
    },
    {
      id: 'tx-103',
      amount: 960,
      customerName: 'Kiran Mart',
      upiApp: 'paytm',
      time: '19 mins ago',
      timestamp: now - 19 * 60 * 1000,
      utrNumber: '412890561982',
      status: 'SUCCESS',
      vpa: 'kiranmart@paytm',
      note: 'Daily groceries',
    },
    {
      id: 'tx-104',
      amount: 540,
      customerName: 'Fresh Store',
      upiApp: 'bhim',
      time: '21 mins ago',
      timestamp: now - 21 * 60 * 1000,
      utrNumber: '412890561554',
      status: 'SUCCESS',
      vpa: 'freshstore@upi',
      note: 'Fruits and dairy',
    },
    {
      id: 'tx-105',
      amount: 780,
      customerName: 'Vijay Grocers',
      upiApp: 'gpay',
      time: '24 mins ago',
      timestamp: now - 24 * 60 * 1000,
      utrNumber: '412890560871',
      status: 'SUCCESS',
      vpa: 'vijaygrocers@okicici',
      note: 'Oil & Atta',
    },
    {
      id: 'tx-106',
      amount: 260,
      customerName: 'Metro Medicos',
      upiApp: 'phonepe',
      time: '27 mins ago',
      timestamp: now - 27 * 60 * 1000,
      utrNumber: '412890559812',
      status: 'SUCCESS',
      vpa: 'metromedicos@axl',
      note: 'First aid kit',
    },
    {
      id: 'tx-107',
      amount: 450,
      customerName: 'Suresh Kumar',
      upiApp: 'amazonpay',
      time: '42 mins ago',
      timestamp: now - 42 * 60 * 1000,
      utrNumber: '412890554109',
      status: 'SUCCESS',
      vpa: 'suresh.k@apl',
      note: 'Tea & snacks supplies',
    },
    {
      id: 'tx-108',
      amount: 1080,
      customerName: 'Anil Kirana',
      upiApp: 'paytm',
      time: '1 hour ago',
      timestamp: now - 65 * 60 * 1000,
      utrNumber: '412890551020',
      status: 'SUCCESS',
      vpa: 'anilkiranastore@paytm',
      note: 'Dry fruits',
    },
  ];

  // Historical transactions across past 50 days for weekly, monthly & till-date accuracy
  const historicalSeed = [
    // Yesterday (Day -1)
    { day: 1, hour: 10, amt: 650, name: 'Ramesh Patel', app: 'phonepe', utr: '41278912001' },
    { day: 1, hour: 12, amt: 1200, name: 'Sunita Verma', app: 'gpay', utr: '41278912002' },
    { day: 1, hour: 15, amt: 480, name: 'Pooja Dairy', app: 'paytm', utr: '41278912003' },
    { day: 1, hour: 17, amt: 2100, name: 'Anand Medicals', app: 'gpay', utr: '41278912004' },
    { day: 1, hour: 19, amt: 1750, name: 'Amit Kirana', app: 'bhim', utr: '41278912005' },

    // Day -2
    { day: 2, hour: 9, amt: 980, name: 'Vijay Traders', app: 'gpay', utr: '41267812001' },
    { day: 2, hour: 11, amt: 2450, name: 'Rajesh Store', app: 'phonepe', utr: '41267812002' },
    { day: 2, hour: 14, amt: 850, name: 'Deepak Sharma', app: 'paytm', utr: '41267812003' },
    { day: 2, hour: 18, amt: 3170, name: 'Kavita Sweets', app: 'gpay', utr: '41267812004' },

    // Day -3
    { day: 3, hour: 10, amt: 1420, name: 'Rahul Provision', app: 'phonepe', utr: '41256712001' },
    { day: 3, hour: 13, amt: 650, name: 'Geeta General', app: 'bhim', utr: '41256712002' },
    { day: 3, hour: 16, amt: 2350, name: 'Balaji Hardware', app: 'gpay', utr: '41256712003' },
    { day: 3, hour: 20, amt: 1500, name: 'Shree Ganesh Store', app: 'paytm', utr: '41256712004' },

    // Day -4
    { day: 4, hour: 11, amt: 2150, name: 'Om Sai Mart', app: 'gpay', utr: '41245612001' },
    { day: 4, hour: 14, amt: 1800, name: 'Manoj Kumar', app: 'phonepe', utr: '41245612002' },
    { day: 4, hour: 17, amt: 2830, name: 'National Bakers', app: 'paytm', utr: '41245612003' },

    // Day -5
    { day: 5, hour: 10, amt: 1320, name: 'Lakshmi Traders', app: 'gpay', utr: '41234512001' },
    { day: 5, hour: 13, amt: 870, name: 'Sanjay Medical', app: 'phonepe', utr: '41234512002' },
    { day: 5, hour: 18, amt: 2700, name: 'Hari Om Kirana', app: 'bhim', utr: '41234512003' },

    // Day -6
    { day: 6, hour: 9, amt: 1640, name: 'Star Stationers', app: 'paytm', utr: '41223412001' },
    { day: 6, hour: 12, amt: 1950, name: 'Pawan Garments', app: 'gpay', utr: '41223412002' },
    { day: 6, hour: 16, amt: 1650, name: 'Shree Ram Store', app: 'phonepe', utr: '41223412003' },

    // Week 2 (Day 8 to 14)
    { day: 8, hour: 11, amt: 2400, name: 'City Supermarket', app: 'gpay', utr: '41201212001' },
    { day: 9, hour: 14, amt: 1950, name: 'Modern Footwear', app: 'phonepe', utr: '41190112001' },
    { day: 11, hour: 16, amt: 3200, name: 'Kalyan Jewellers Token', app: 'paytm', utr: '41178912001' },
    { day: 13, hour: 12, amt: 2850, name: 'Krishna Dairy', app: 'gpay', utr: '41156712001' },

    // Week 3 (Day 15 to 21)
    { day: 16, hour: 10, amt: 3400, name: 'Royal Electronics', app: 'phonepe', utr: '41123412001' },
    { day: 18, hour: 15, amt: 2100, name: 'Choudhary Sweets', app: 'gpay', utr: '41101212001' },
    { day: 20, hour: 18, amt: 4150, name: 'Apex Distributors', app: 'paytm', utr: '41089012001' },

    // Week 4 (Day 22 to 30)
    { day: 23, hour: 11, amt: 2900, name: 'Sai Shraddha Store', app: 'gpay', utr: '41056712001' },
    { day: 26, hour: 14, amt: 3800, name: 'Vandana Silk Mills', app: 'phonepe', utr: '41023412001' },
    { day: 29, hour: 17, amt: 4600, name: 'Gupta Wholesale', app: 'bhim', utr: '40990112001' },

    // Previous Month (Day 35 to 55) for Till Date reporting
    { day: 35, hour: 10, amt: 5200, name: 'Mahalaxmi Enterprises', app: 'gpay', utr: '40923412001' },
    { day: 42, hour: 14, amt: 6400, name: 'Shiva Agro Agencies', app: 'phonepe', utr: '40856712001' },
    { day: 50, hour: 16, amt: 4900, name: 'Bharat Petroleum Counter', app: 'paytm', utr: '40789012001' },
  ];

  const historicalTx: Transaction[] = historicalSeed.map((h, i) => {
    const ts = now - h.day * ONE_DAY + h.hour * ONE_HOUR;
    return {
      id: `tx-hist-${i + 1}`,
      amount: h.amt,
      customerName: h.name,
      upiApp: h.app as UpiAppId,
      time: `${h.day} day${h.day > 1 ? 's' : ''} ago`,
      timestamp: ts,
      utrNumber: h.utr,
      status: 'SUCCESS',
      vpa: `${h.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@upi`,
      note: 'Payment received via UPI QR',
    };
  });

  return [...baseToday, ...historicalTx];
}

export const INITIAL_TRANSACTIONS: Transaction[] = generateInitialTransactions();

export const UPI_APPS_CONFIG: Record<UpiAppId, {
  name: string;
  badge: string;
  brandColor: string;
  bgLight: string;
  textColor: string;
  gradient: string;
}> = {
  gpay: {
    name: 'Google Pay',
    badge: 'G',
    brandColor: '#4285F4',
    bgLight: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    textColor: 'text-blue-500',
    gradient: 'from-blue-600 via-indigo-600 to-sky-500',
  },
  phonepe: {
    name: 'PhonePe',
    badge: 'Ph',
    brandColor: '#5F259F',
    bgLight: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
    textColor: 'text-purple-600 dark:text-purple-400',
    gradient: 'from-purple-700 via-purple-600 to-indigo-700',
  },
  paytm: {
    name: 'Paytm',
    badge: 'P',
    brandColor: '#00BAF2',
    bgLight: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20',
    textColor: 'text-cyan-600 dark:text-cyan-400',
    gradient: 'from-sky-500 via-cyan-600 to-blue-700',
  },
  bhim: {
    name: 'BHIM UPI',
    badge: 'B',
    brandColor: '#28A745',
    bgLight: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    textColor: 'text-emerald-600 dark:text-emerald-400',
    gradient: 'from-emerald-600 via-teal-600 to-green-700',
  },
  amazonpay: {
    name: 'Amazon Pay',
    badge: 'A',
    brandColor: '#FF9900',
    bgLight: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    textColor: 'text-amber-600 dark:text-amber-400',
    gradient: 'from-amber-500 via-orange-600 to-amber-700',
  },
  cred: {
    name: 'Cred UPI',
    badge: 'Cr',
    brandColor: '#18181b',
    bgLight: 'bg-zinc-500/10 text-zinc-800 dark:text-zinc-200 border-zinc-500/20',
    textColor: 'text-zinc-700 dark:text-zinc-300',
    gradient: 'from-zinc-800 via-zinc-900 to-black',
  },
  mobikwik: {
    name: 'MobiKwik',
    badge: 'M',
    brandColor: '#0070BA',
    bgLight: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    textColor: 'text-blue-600 dark:text-blue-400',
    gradient: 'from-blue-600 to-cyan-600',
  },
};
