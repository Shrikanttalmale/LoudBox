/**
 * UPI Notification Extraction & Validation Engine
 * 
 * Safely extracts:
 * 1. Payer / Sender Name (Google Pay, PhonePe, Paytm, BHIM, Amazon Pay, Bank alerts)
 * 2. Payment Amount (INR / ₹ / Rs.)
 * 3. Originating UPI App
 * 
 * Enforces strict safety rules:
 * - Rejects FAILED notifications (declined, failed, cancelled, reversed)
 * - Rejects PENDING / IN-PROGRESS notifications (pending, processing, collect requests)
 * - Rejects OUTGOING DEBIT notifications (paid to, sent to, debited from, you paid)
 * - Rejects REFUND, CASHBACK & SYSTEM notifications (refund of, cashback won, otp, bill paid)
 * - Rejects DUPLICATE notifications (same transaction within 45 seconds debounce window)
 * - Fallbacks cleanly to announcing only the amount when sender name is absent or unavailable
 */

import { UpiAppId } from './audioEngine';

export interface ParsedUpiNotification {
  isValidPayment: boolean;
  amount?: number;
  senderName?: string;
  upiApp: UpiAppId;
  appName: string;
  status: 'ACCEPTED' | 'REJECTED';
  rejectionReason?: 
    | 'FAILED_PAYMENT' 
    | 'PENDING_PAYMENT' 
    | 'OUTGOING_DEBIT' 
    | 'REFUND_OR_CASHBACK' 
    | 'NO_AMOUNT_FOUND' 
    | 'NOT_A_PAYMENT' 
    | 'DUPLICATE_NOTIFICATION';
  explanation: string;
  rawTitle: string;
  rawText: string;
}

// In-memory deduplication cache: signature -> timestamp
const recentNotificationCache = new Map<string, number>();
const DEDUPLICATION_WINDOW_MS = 45 * 1000; // 45 seconds window

/**
 * Clean cache entries older than 3 minutes to avoid memory accumulation
 */
function cleanExpiredCacheEntries(now: number) {
  for (const [key, timestamp] of recentNotificationCache.entries()) {
    if (now - timestamp > 180 * 1000) {
      recentNotificationCache.delete(key);
    }
  }
}

/**
 * Reset deduplication cache (useful for testing)
 */
export function resetDeduplicationCache(): void {
  recentNotificationCache.clear();
}

/**
 * Detect originating UPI application from package name, title, or body text
 */
export function detectUpiApp(packageName?: string, title = '', body = ''): { appId: UpiAppId; appName: string } {
  const combined = `${packageName || ''} ${title} ${body}`.toLowerCase();

  if (combined.includes('nbu.paisa.user') || combined.includes('google pay') || combined.includes('gpay')) {
    return { appId: 'gpay', appName: 'Google Pay' };
  }
  if (combined.includes('phonepe')) {
    return { appId: 'phonepe', appName: 'PhonePe' };
  }
  if (combined.includes('paytm')) {
    return { appId: 'paytm', appName: 'Paytm' };
  }
  if (combined.includes('org.npci.upiapp') || combined.includes('bhim')) {
    return { appId: 'bhim', appName: 'BHIM UPI' };
  }
  if (combined.includes('amazon') && (combined.includes('pay') || combined.includes('upi'))) {
    return { appId: 'amazonpay', appName: 'Amazon Pay' };
  }
  if (combined.includes('cred')) {
    return { appId: 'cred', appName: 'CRED' };
  }
  if (combined.includes('mobikwik')) {
    return { appId: 'mobikwik', appName: 'MobiKwik' };
  }

  return { appId: 'gpay', appName: 'UPI' };
}

/**
 * Extract numerical payment amount from notification text
 */
export function extractPaymentAmount(content: string): number | null {
  // Matches ₹500, Rs. 1,250.00, Rs 500, INR 990, etc.
  const amountRegexes = [
    /(?:Rs\.?|INR|₹)\s*([\d,]+(?:\.\d{1,2})?)/i,
    /(?:received|credited|paid)\s*(?:Rs\.?|INR|₹)?\s*([\d,]+(?:\.\d{1,2})?)/i,
    /([\\d,]+(?:\.\d{1,2})?)\s*(?:rupees|rupaye|rs\.?|inr|₹)/i,
  ];

  for (const regex of amountRegexes) {
    const match = content.match(regex);
    if (match && match[1]) {
      const cleanNum = match[1].replace(/,/g, '');
      const parsed = parseFloat(cleanNum);
      if (!isNaN(parsed) && parsed > 0) {
        return parsed;
      }
    }
  }

  return null;
}

/**
 * Blacklist of system/generic words that should NEVER be treated as a sender person's name
 */
const SENDER_NAME_BLACKLIST = new Set([
  'upi', 'gpay', 'google pay', 'phonepe', 'paytm', 'bhim', 'amazon pay', 'cred',
  'mobikwik', 'bank', 'account', 'customer', 'merchant', 'you', 'someone',
  'user', 'money', 'payment', 'transfer', 'alert', 'notification', 'cashback',
  'refund', 'ref', 'utr', 'balance', 'updated balance', 'instant', 'credited', 'received'
]);

/**
 * Clean, sanitize and validate extracted sender/payer name
 */
export function cleanSenderName(rawName?: string | null): string | undefined {
  if (!rawName) return undefined;

  let cleaned = rawName
    .replace(/[•\-_|,;:].*$/, '') // remove trailing punctuation and suffixes
    .replace(/\b(?:via|using|on|through|by|with)\s+(?:UPI|GPay|PhonePe|Paytm|BHIM|Amazon Pay|Bank).*$/i, '')
    .replace(/\b(?:A\/C|AC|Ref|UTR|No|UPI\s*Ref|Txn|TxnId).*$/i, '')
    .trim();

  // Strip leading/trailing quotation marks or brackets
  cleaned = cleaned.replace(/^["'(\[]+|["')\]]+$/g, '').trim();

  // Validate length and content
  if (cleaned.length < 2 || cleaned.length > 35) {
    return undefined;
  }

  // If name has excessive digits (e.g. phone number or account number), reject as name
  if (/\d{4,}/.test(cleaned)) {
    return undefined;
  }

  // Check if name is in system blacklist
  if (SENDER_NAME_BLACKLIST.has(cleaned.toLowerCase())) {
    return undefined;
  }

  // Capitalize neatly: e.g. "rahul sharma" -> "Rahul Sharma"
  return cleaned
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Extract sender/payer name from title and text using heuristics across major UPI apps
 */
export function extractSenderName(title = '', body = '', appName = ''): string | undefined {
  const fullText = `${title} ${body}`;

  // Pattern 1: "<Name> paid you ₹..." or "<Name> has paid you ₹..." (Google Pay standard)
  const paidYouMatch = fullText.match(/(?:^|\n|[\s])([A-Za-z0-9\s.]{2,35}?)\s+(?:has\s+)?paid\s+you\s+(?:Rs\.?|INR|₹)/i);
  if (paidYouMatch && paidYouMatch[1]) {
    const candidate = cleanSenderName(paidYouMatch[1]);
    if (candidate) return candidate;
  }

  // Pattern 2: "... from <Name>" (e.g. "Received ₹500 from Rahul Sharma", "Payment of ₹1,250 received from Neha Verma")
  const fromMatch = fullText.match(
    /\bfrom\s+([A-Za-z0-9\s.]{2,35}?)(?:[.,;]|\s+on\b|\s+via\b|\s+at\b|\s+UPI\b|\s+Ref\b|\s+UTR\b|\s+Updated\b|\s+to\b|\s*$)/i
  );
  if (fromMatch && fromMatch[1]) {
    const candidate = cleanSenderName(fromMatch[1]);
    if (candidate) return candidate;
  }

  // Pattern 3: "Money received: ₹... from <Name>"
  const moneyReceivedMatch = fullText.match(/money\s+received\s*:\s*(?:Rs\.?|INR|₹)?\s*[\d,]+(?:\.\d{1,2})?\s+from\s+([A-Za-z0-9\s.]{2,35}?)(?:[.,;]|\s+via\b|\s+on\b|\s*$)/i);
  if (moneyReceivedMatch && moneyReceivedMatch[1]) {
    const candidate = cleanSenderName(moneyReceivedMatch[1]);
    if (candidate) return candidate;
  }


  // Pattern 4: "<Name> sent you ₹..."
  const sentYouMatch = fullText.match(/(?:^|\n|[\s])([A-Za-z0-9\s.]{2,35}?)\s+sent\s+you\s+(?:Rs\.?|INR|₹)/i);
  if (sentYouMatch && sentYouMatch[1]) {
    const candidate = cleanSenderName(sentYouMatch[1]);
    if (candidate) return candidate;
  }

  // Pattern 5: "Credited by <Name>" (Bank & BHIM alerts)
  const creditedByMatch = fullText.match(/(?:credited|deposited)\s+(?:to\s+A\/C\s+)?by\s+([A-Za-z0-9\s.]{2,35}?)(?:[.,;]|\s+on\b|\s+UPI\b|\s+Ref\b|\s*$)/i);
  if (creditedByMatch && creditedByMatch[1]) {
    const candidate = cleanSenderName(creditedByMatch[1]);
    if (candidate) return candidate;
  }

  // Pattern 6: Title IS the person's name (common in Google Pay & Samsung messages)
  // E.g., Title: "Rahul Sharma", Body: "₹500 received" or "Paid you ₹500"
  const cleanTitle = title.trim();
  const lowerTitle = cleanTitle.toLowerCase();
  const lowerAppName = appName.toLowerCase();

  const isGenericTitle =
    lowerTitle === lowerAppName ||
    lowerTitle.includes('paytm') ||
    lowerTitle.includes('phonepe') ||
    lowerTitle.includes('google pay') ||
    lowerTitle.includes('payment received') ||
    lowerTitle.includes('money received') ||
    lowerTitle.includes('bhim') ||
    lowerTitle.includes('upi');

  if (!isGenericTitle && cleanTitle.length >= 2 && cleanTitle.length <= 35) {
    if (/(?:paid\s+you|received|sent)/i.test(body)) {
      const candidate = cleanSenderName(cleanTitle);
      if (candidate) return candidate;
    }
  }

  return undefined;
}

/**
 * Main parser function: Validates notification, filters out false alerts / duplicates,
 * and extracts amount + sender name.
 */
export function parseUpiNotification(
  title = '',
  body = '',
  packageName?: string,
  options: { checkDuplicates?: boolean } = { checkDuplicates: true }
): ParsedUpiNotification {
  const fullContent = `${title} ${body}`.trim();
  const lowerContent = fullContent.toLowerCase();
  const { appId, appName } = detectUpiApp(packageName, title, body);

  // 1. REJECT FAILED / UNPAID NOTIFICATIONS
  const isFailed = /\b(failed|failure|declined|cancelled|canceled|rejected|couldn['’]?t be processed|could not be processed|timed out|reversed)\b/i.test(lowerContent);
  if (isFailed) {
    return {
      isValidPayment: false,
      status: 'REJECTED',
      upiApp: appId,
      appName,
      rejectionReason: 'FAILED_PAYMENT',
      explanation: 'Ignored: Payment failed or was declined/cancelled. No announcement made.',
      rawTitle: title,
      rawText: body,
    };
  }

  // 2. REJECT REFUND / CASHBACK / PROMOTIONS / OTPs
  const isRefundOrPromo = /\b(refund|cashback|scratch card|reward|coupon|recharge successful|bill payment successful|otp|one time password|verification code|security alert|login alert)\b/i.test(lowerContent);
  if (isRefundOrPromo) {
    return {
      isValidPayment: false,
      status: 'REJECTED',
      upiApp: appId,
      appName,
      rejectionReason: 'REFUND_OR_CASHBACK',
      explanation: 'Ignored: Refund, promotional cashback, OTP, or non-business notification.',
      rawTitle: title,
      rawText: body,
    };
  }

  // 3. REJECT PENDING / IN-PROGRESS / COLLECT REQUEST NOTIFICATIONS
  const isPending = /\b(pending|processing|initiated|in progress|awaiting confirmation|collect request|requested from you|approve request)\b/i.test(lowerContent);
  if (isPending) {
    return {
      isValidPayment: false,
      status: 'REJECTED',
      upiApp: appId,
      appName,
      rejectionReason: 'PENDING_PAYMENT',
      explanation: 'Ignored: Payment is still pending or is an unapproved collect request.',
      rawTitle: title,
      rawText: body,
    };
  }


  // 3. REJECT OUTGOING / DEBIT / SENT NOTIFICATIONS (When merchant paid someone else)
  // Must avoid false alarms when the merchant themselves makes a purchase or transfers money!
  const isOutgoing = /\b(paid to|sent to|transferred to|debited from|you paid|money sent|sent rs|sent inr|sent ₹|spent at|withdrawn|payment to)\b/i.test(lowerContent);
  if (isOutgoing) {
    return {
      isValidPayment: false,
      status: 'REJECTED',
      upiApp: appId,
      appName,
      rejectionReason: 'OUTGOING_DEBIT',
      explanation: 'Ignored: Outgoing debit/money sent alert. Loudbox only announces incoming customer payments.',
      rawTitle: title,
      rawText: body,
    };
  }

  // 5. CHECK POSITIVE INCOMING PAYMENT CONFIRMATION
  const isCredit = /\b(received|credited|paid you|sent you|transferred|deposited|added to|accepted|payment from)\b/i.test(lowerContent);
  if (!isCredit) {
    return {
      isValidPayment: false,
      status: 'REJECTED',
      upiApp: appId,
      appName,
      rejectionReason: 'NOT_A_PAYMENT',
      explanation: 'Ignored: Notification does not indicate an incoming UPI credit.',
      rawTitle: title,
      rawText: body,
    };
  }

  // 6. EXTRACT AMOUNT
  const amount = extractPaymentAmount(fullContent);
  if (!amount || amount <= 0) {
    return {
      isValidPayment: false,
      status: 'REJECTED',
      upiApp: appId,
      appName,
      rejectionReason: 'NO_AMOUNT_FOUND',
      explanation: 'Ignored: Could not detect valid monetary amount in notification.',
      rawTitle: title,
      rawText: body,
    };
  }

  // 7. EXTRACT SENDER / PAYER NAME
  const senderName = extractSenderName(title, body, appName);

  // 8. DUPLICATE NOTIFICATION FILTERING
  if (options.checkDuplicates !== false) {
    const now = Date.now();
    cleanExpiredCacheEntries(now);

    const senderKey = senderName ? senderName.toLowerCase().replace(/\s+/g, '') : 'unknown';
    const signature = `${appId}:${amount}:${senderKey}`;

    const lastSeen = recentNotificationCache.get(signature);
    if (lastSeen && now - lastSeen < DEDUPLICATION_WINDOW_MS) {
      return {
        isValidPayment: false,
        status: 'REJECTED',
        amount,
        senderName,
        upiApp: appId,
        appName,
        rejectionReason: 'DUPLICATE_NOTIFICATION',
        explanation: `Ignored duplicate: Same payment alert (₹${amount}${senderName ? ` from ${senderName}` : ''}) was already processed ${Math.round((now - lastSeen) / 1000)}s ago.`,
        rawTitle: title,
        rawText: body,
      };
    }

    // Save into cache
    recentNotificationCache.set(signature, now);
  }

  // 9. VALID INCOMING PAYMENT!
  return {
    isValidPayment: true,
    status: 'ACCEPTED',
    amount,
    senderName,
    upiApp: appId,
    appName,
    explanation: senderName
      ? `Valid payment of ₹${amount} from ${senderName} on ${appName}.`
      : `Valid payment of ₹${amount} on ${appName} (Sender name unavailable - announcing amount only).`,
    rawTitle: title,
    rawText: body,
  };
}

/**
 * Pre-configured real-world notification test cases for developer/merchant testing
 */
export interface SampleNotificationTestCase {
  id: string;
  name: string;
  app: UpiAppId;
  title: string;
  body: string;
  expectedType: 'VALID_WITH_NAME' | 'VALID_AMOUNT_ONLY' | 'REJECT_FAILED' | 'REJECT_PENDING' | 'REJECT_OUTGOING' | 'REJECT_REFUND';
  description: string;
}

export const SAMPLE_NOTIFICATION_TEST_CASES: SampleNotificationTestCase[] = [
  {
    id: 'gpay_with_name',
    name: 'Google Pay (Valid + Payer Name)',
    app: 'gpay',
    title: 'Rahul Sharma',
    body: 'Paid you ₹500.00 via Google Pay',
    expectedType: 'VALID_WITH_NAME',
    description: 'Real Google Pay format: contact name in title, payment confirmation in body.',
  },
  {
    id: 'phonepe_with_name',
    name: 'PhonePe (Valid + Payer Name)',
    app: 'phonepe',
    title: 'Payment Received',
    body: 'Payment of ₹1,250 received from Neha Verma on PhonePe UPI. Ref: 412890562309',
    expectedType: 'VALID_WITH_NAME',
    description: 'PhonePe merchant format: contains amount and sender name with transaction reference.',
  },
  {
    id: 'paytm_with_name',
    name: 'Paytm (Valid + Payer Name)',
    app: 'paytm',
    title: 'Paytm Payments Bank',
    body: 'Received ₹750 from Amit Patel. Updated Paytm balance: ₹4,820.',
    expectedType: 'VALID_WITH_NAME',
    description: 'Paytm format: sender name and amount followed by account balance.',
  },
  {
    id: 'bhim_amount_only',
    name: 'BHIM UPI (Valid, Amount Only)',
    app: 'bhim',
    title: 'BHIM UPI Alert',
    body: '₹350.00 credited to your A/C. UPI Ref 412890561554',
    expectedType: 'VALID_AMOUNT_ONLY',
    description: 'Sender name unavailable in SMS/Notification -> Safely announces only the amount.',
  },
  {
    id: 'fail_rejected',
    name: 'GPay Failed (Rejected)',
    app: 'gpay',
    title: 'Google Pay',
    body: 'Payment of ₹1,000 from Suresh Kumar failed. The money was not debited.',
    expectedType: 'REJECT_FAILED',
    description: 'False alert blocked: Failed transactions must never trigger a voice announcement.',
  },
  {
    id: 'pending_rejected',
    name: 'PhonePe Pending (Rejected)',
    app: 'phonepe',
    title: 'PhonePe UPI',
    body: 'Payment of ₹450 from Vijay is pending bank confirmation. Please wait.',
    expectedType: 'REJECT_PENDING',
    description: 'False alert blocked: In-progress or pending payments are rejected.',
  },
  {
    id: 'outgoing_rejected',
    name: 'Outgoing Debit (Rejected)',
    app: 'paytm',
    title: 'Paytm',
    body: 'You paid ₹820 to Modern Medical Store from your Wallet.',
    expectedType: 'REJECT_OUTGOING',
    description: 'False alert blocked: Outgoing payments (merchant spent money) are rejected.',
  },
  {
    id: 'refund_rejected',
    name: 'Refund Alert (Rejected)',
    app: 'amazonpay',
    title: 'Amazon Pay',
    body: 'Refund of ₹299 initiated for your returned order. Will credit in 2 days.',
    expectedType: 'REJECT_REFUND',
    description: 'False alert blocked: Refunds and cashback promotions are rejected.',
  },
];
