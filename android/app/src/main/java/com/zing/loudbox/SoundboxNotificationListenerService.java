package com.zing.loudbox;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.media.AudioManager;
import android.media.ToneGenerator;
import android.os.Build;
import android.os.Bundle;
import android.service.notification.NotificationListenerService;
import android.service.notification.StatusBarNotification;
import android.speech.tts.TextToSpeech;
import android.util.Log;
import androidx.core.app.NotificationCompat;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Native Android Background Notification Listener Service.
 * Runs 24/7 in background even when user closes/swipes away the app.
 * Intercepts incoming UPI payments from GPay, PhonePe, Paytm, BHIM, Amazon Pay.
 * 
 * Features:
 * 1. Robust extraction of Payer/Sender Name & Payment Amount
 * 2. False Alert & Fraud Protection: Rejects Failed, Pending, Outgoing Debit, and Refund alerts
 * 3. In-memory Deduplication: Drops duplicate OS alerts within a 45-second debounce window
 * 4. ON/OFF Preference Check: Announce sender name when enabled; gracefully fall back to amount-only if disabled or unavailable.
 */
public class SoundboxNotificationListenerService extends NotificationListenerService implements TextToSpeech.OnInitListener {
    private static final String TAG = "SoundboxListener";
    private static final String CHANNEL_ID = "soundbox_foreground_service_channel";
    private static final int NOTIFICATION_ID = 1001;

    public static final String PREFS_NAME = "SoundboxSettings";
    public static final String PREF_ANNOUNCE_SENDER = "announce_sender_name";

    private TextToSpeech textToSpeech;
    private boolean isTtsReady = false;

    // Supported UPI Package Names
    private static final String GPAY_PKG = "com.google.android.apps.nbu.paisa.user";
    private static final String PHONEPE_PKG = "com.phonepe.app";
    private static final String PAYTM_PKG = "net.one97.paytm";
    private static final String BHIM_PKG = "in.org.npci.upiapp";
    private static final String AMAZON_PKG = "in.amazon.mShop.android.shopping";
    private static final String CRED_PKG = "com.dreamplug.androidapp";
    private static final String MOBIKWIK_PKG = "com.mobikwik_new";

    // Deduplication Cache: signature -> timestamp
    private static final Map<String, Long> recentTransactionsCache = new ConcurrentHashMap<>();
    private static final long DEDUP_WINDOW_MS = 45000; // 45 seconds

    // Blacklist of system terms that should never be spoken as a sender's name
    private static final Set<String> SENDER_BLACKLIST = new HashSet<>(Arrays.asList(
            "upi", "gpay", "google pay", "phonepe", "paytm", "bhim", "amazon pay", "cred",
            "mobikwik", "bank", "account", "customer", "merchant", "you", "someone",
            "user", "money", "payment", "transfer", "alert", "notification", "cashback",
            "refund", "ref", "utr", "balance", "updated balance", "instant", "credited", "received"
    ));

    @Override
    public void onCreate() {
        super.onCreate();
        Log.d(TAG, "Soundbox Background Notification Listener Service Created");
        initTextToSpeech();
        startForegroundServiceNotification();
    }

    private void initTextToSpeech() {
        textToSpeech = new TextToSpeech(getApplicationContext(), this);
    }

    @Override
    public void onInit(int status) {
        if (status == TextToSpeech.SUCCESS) {
            int result = textToSpeech.setLanguage(new Locale("hi", "IN"));
            if (result == TextToSpeech.LANG_MISSING_DATA || result == TextToSpeech.LANG_NOT_SUPPORTED) {
                textToSpeech.setLanguage(new Locale("en", "IN"));
            }
            textToSpeech.setSpeechRate(1.05f);
            textToSpeech.setPitch(1.0f);
            isTtsReady = true;
            Log.d(TAG, "TextToSpeech initialized successfully");
        } else {
            Log.e(TAG, "Failed to initialize TextToSpeech");
        }
    }

    private void startForegroundServiceNotification() {
        createNotificationChannel();

        Intent notificationIntent = new Intent(this, MainActivity.class);
        PendingIntent pendingIntent = PendingIntent.getActivity(
                this, 0, notificationIntent,
                PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT
        );

        Notification notification = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle("Loudbox Active & Listening")
                .setContentText("Monitoring UPI alerts (GPay, PhonePe, Paytm, BHIM)")
                .setSmallIcon(android.R.drawable.ic_lock_silent_mode_off)
                .setContentIntent(pendingIntent)
                .setOngoing(true)
                .setPriority(NotificationCompat.PRIORITY_LOW)
                .build();

        startForeground(NOTIFICATION_ID, notification);
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel serviceChannel = new NotificationChannel(
                    CHANNEL_ID,
                    "Loudbox Background Service",
                    NotificationManager.IMPORTANCE_LOW
            );
            serviceChannel.setDescription("Keeps Loudbox alive to announce UPI payments even when closed");
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(serviceChannel);
            }
        }
    }

    @Override
    public void onNotificationPosted(StatusBarNotification sbn) {
        if (sbn == null) return;

        String packageName = sbn.getPackageName();
        Notification notification = sbn.getNotification();
        if (notification == null) return;

        Bundle extras = notification.extras;
        if (extras == null) return;

        String title = extras.getString(Notification.EXTRA_TITLE, "");
        CharSequence textChar = extras.getCharSequence(Notification.EXTRA_TEXT);
        String text = textChar != null ? textChar.toString() : "";
        String fullContent = (title + " " + text).trim();

        Log.d(TAG, "Notification received from: " + packageName + " | Content: " + fullContent);

        // 1. Check if package or text corresponds to a supported UPI app
        String appName = identifyUpiApp(packageName, fullContent);
        if (appName == null) {
            return;
        }

        // 2. Reject FAILED, PENDING, OUTGOING DEBIT, and REFUND notifications
        if (isFalseOrNonPaymentNotification(fullContent)) {
            Log.i(TAG, "Blocked non-credit alert (failed/pending/outgoing/refund): " + fullContent);
            return;
        }

        // 3. Confirm positive incoming payment / credit keywords
        if (!isPositiveCreditConfirmation(fullContent)) {
            Log.d(TAG, "Notification does not confirm received funds: " + fullContent);
            return;
        }

        // 4. Extract Payment Amount
        Double amount = extractAmount(fullContent);
        if (amount == null || amount <= 0) {
            Log.d(TAG, "Could not extract valid amount from: " + fullContent);
            return;
        }

        // 5. Extract Sender / Payer Name
        String senderName = extractSenderName(title, text, appName);

        // 6. Deduplication Check (Filter identical alerts within 45 seconds)
        long now = System.currentTimeMillis();
        cleanExpiredCacheEntries(now);

        String signature = appName + ":" + amount.intValue() + ":" + (senderName != null ? senderName.toLowerCase().replaceAll("\\s+", "") : "unknown");
        Long lastSeen = recentTransactionsCache.get(signature);
        if (lastSeen != null && (now - lastSeen) < DEDUP_WINDOW_MS) {
            Log.i(TAG, "Dropped duplicate notification within " + ((now - lastSeen) / 1000) + "s: " + signature);
            return;
        }
        recentTransactionsCache.put(signature, now);

        // 7. Check ON/OFF Setting for Sender Name Announcement
        SharedPreferences prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        boolean announceSender = prefs.getBoolean(PREF_ANNOUNCE_SENDER, true);

        // Announce Payment
        announcePaymentAlert(appName, amount.intValue(), announceSender ? senderName : null);
    }

    private String identifyUpiApp(String packageName, String content) {
        String lower = (packageName + " " + content).toLowerCase();
        if (packageName.equals(GPAY_PKG) || lower.contains("google pay") || lower.contains("gpay")) {
            return "Google Pay";
        } else if (packageName.equals(PHONEPE_PKG) || lower.contains("phonepe")) {
            return "PhonePe";
        } else if (packageName.equals(PAYTM_PKG) || lower.contains("paytm")) {
            return "Paytm";
        } else if (packageName.equals(BHIM_PKG) || lower.contains("bhim")) {
            return "BHIM UPI";
        } else if (packageName.equals(AMAZON_PKG) && (lower.contains("pay") || lower.contains("upi"))) {
            return "Amazon Pay";
        } else if (packageName.equals(CRED_PKG) || lower.contains("cred")) {
            return "CRED";
        } else if (packageName.equals(MOBIKWIK_PKG) || lower.contains("mobikwik")) {
            return "MobiKwik";
        }
        return null;
    }

    /**
     * Rejects failed, pending, outgoing debit, or refund/promo alerts
     */
    private boolean isFalseOrNonPaymentNotification(String content) {
        String lower = content.toLowerCase();

        // Failed
        if (lower.matches(".*\\b(failed|failure|declined|cancelled|canceled|rejected|couldn['’]?t be processed|could not be processed|timed out|reversed)\\b.*")) {
            return true;
        }
        // Pending
        if (lower.matches(".*\\b(pending|processing|initiated|in progress|awaiting confirmation|collect request|requested from you|approve request)\\b.*")) {
            return true;
        }
        // Outgoing debit (merchant spent or sent money)
        if (lower.matches(".*\\b(paid to|sent to|transferred to|debited from|you paid|money sent|sent rs|sent inr|sent ₹|spent at|withdrawn|payment to)\\b.*")) {
            return true;
        }
        // Refund / Cashback / OTP
        if (lower.matches(".*\\b(refund of|refund initiated|refund processed|cashback won|cashback of|scratch card|reward|coupon|recharge successful|bill payment successful|otp|one time password|verification code)\\b.*")) {
            return true;
        }

        return false;
    }

    /**
     * Checks if notification contains affirmative incoming credit confirmation
     */
    private boolean isPositiveCreditConfirmation(String content) {
        String lower = content.toLowerCase();
        return lower.matches(".*\\b(received|credited|paid you|sent you|transferred|deposited|added to|accepted|payment from)\\b.*");
    }

    /**
     * Extract numerical monetary value
     */
    private Double extractAmount(String text) {
        Pattern pattern = Pattern.compile("(?:Rs\\.?|INR|₹)\\s*([\\d,]+(?:\\.\\d{1,2})?)", Pattern.CASE_INSENSITIVE);
        Matcher matcher = pattern.matcher(text);
        if (matcher.find()) {
            String clean = matcher.group(1).replace(",", "");
            try {
                return Double.parseDouble(clean);
            } catch (NumberFormatException e) {
                Log.e(TAG, "Amount parse error: " + e.getMessage());
            }
        }
        return null;
    }

    /**
     * Extracts sender/payer name across UPI patterns
     */
    private String extractSenderName(String title, String body, String appName) {
        String full = (title + " " + body).trim();

        // Pattern 1: "<Name> paid you ₹..."
        Pattern p1 = Pattern.compile("(?:^|\\n|[\\s])([A-Za-z0-9\\s.]{2,35}?)\\s+(?:has\\s+)?paid\\s+you\\s+(?:Rs\\.?|INR|₹)", Pattern.CASE_INSENSITIVE);
        Matcher m1 = p1.matcher(full);
        if (m1.find()) {
            String name = sanitizeName(m1.group(1));
            if (name != null) return name;
        }

        // Pattern 2: "... from <Name>" (e.g. "Received ₹500 from Rahul Sharma", "Payment of ₹1,250 received from Neha Verma")
        Pattern p2 = Pattern.compile("\\bfrom\\s+([A-Za-z0-9\\s.]{2,35}?)(?:[.,;]|\\s+on\\b|\\s+via\\b|\\s+at\\b|\\s+UPI\\b|\\s+Ref\\b|\\s+UTR\\b|\\s+Updated\\b|\\s+to\\b|$)", Pattern.CASE_INSENSITIVE);
        Matcher m2 = p2.matcher(full);
        if (m2.find()) {
            String name = sanitizeName(m2.group(1));
            if (name != null) return name;
        }


        // Pattern 3: "Money received: ₹... from <Name>"
        Pattern p3 = Pattern.compile("money\\s+received\\s*:\\s*(?:Rs\\.?|INR|₹)?\\s*[\\d,]+(?:\\.\\d{1,2})?\\s+from\\s+([A-Za-z0-9\\s.]{2,35}?)(?:[.,;]|\\s+via\\b|\\s+on\\b|$)", Pattern.CASE_INSENSITIVE);
        Matcher m3 = p3.matcher(full);
        if (m3.find()) {
            String name = sanitizeName(m3.group(1));
            if (name != null) return name;
        }

        // Pattern 4: Title is the person's name (Google Pay contact format)
        if (title != null && !title.trim().isEmpty()) {
            String cleanTitle = title.trim();
            String lowerTitle = cleanTitle.toLowerCase();
            String lowerApp = appName.toLowerCase();
            boolean isGeneric = lowerTitle.equals(lowerApp) || lowerTitle.contains("paytm") || lowerTitle.contains("phonepe") ||
                    lowerTitle.contains("google pay") || lowerTitle.contains("payment") || lowerTitle.contains("bhim");
            if (!isGeneric && cleanTitle.length() >= 2 && cleanTitle.length() <= 35) {
                if (body != null && (body.toLowerCase().contains("paid you") || body.toLowerCase().contains("received"))) {
                    String name = sanitizeName(cleanTitle);
                    if (name != null) return name;
                }
            }
        }

        return null;
    }

    private String sanitizeName(String raw) {
        if (raw == null) return null;
        String cleaned = raw.replaceAll("[•\\-_|,;:].*$", "")
                .replaceAll("(?i)\\b(?:via|using|on|through|by|with)\\s+(?:UPI|GPay|PhonePe|Paytm|BHIM|Amazon Pay|Bank).*$", "")
                .replaceAll("(?i)\\b(?:A/C|AC|Ref|UTR|No|Txn).*$", "")
                .trim();

        if (cleaned.length() < 2 || cleaned.length() > 35) return null;
        if (cleaned.matches(".*\\d{4,}.*")) return null; // Reject if contains account or phone number
        if (SENDER_BLACKLIST.contains(cleaned.toLowerCase())) return null;

        // Proper capitalization
        String[] parts = cleaned.split("\\s+");
        StringBuilder sb = new StringBuilder();
        for (String p : parts) {
            if (!p.isEmpty()) {
                sb.append(Character.toUpperCase(p.charAt(0)));
                if (p.length() > 1) {
                    sb.append(p.substring(1).toLowerCase());
                }
                sb.append(" ");
            }
        }
        return sb.toString().trim();
    }

    private void cleanExpiredCacheEntries(long now) {
        for (Map.Entry<String, Long> entry : recentTransactionsCache.entrySet()) {
            if (now - entry.getValue() > 180000) { // 3 minutes
                recentTransactionsCache.remove(entry.getKey());
            }
        }
    }

    /**
     * Announce payment alert using chime and TextToSpeech.
     * Incorporates sender name when available; otherwise announces amount only.
     */
    private void announcePaymentAlert(String appName, int amount, String senderName) {
        Log.i(TAG, "Announcing Payment: ₹" + amount + " on " + appName + (senderName != null ? " from " + senderName : " (amount only)"));

        // Step 1: Play soundbox chime tone
        try {
            ToneGenerator toneGen = new ToneGenerator(AudioManager.STREAM_MUSIC, 100);
            toneGen.startTone(ToneGenerator.TONE_CDMA_ALERT_NETWORK_LITE, 250);
        } catch (Exception e) {
            Log.e(TAG, "Chime playback error: " + e.getMessage());
        }

        // Step 2: Speak announcement with or without sender name
        if (isTtsReady && textToSpeech != null) {
            String spokenText;
            if (senderName != null && !senderName.isEmpty()) {
                // Sender name included
                if (appName.equalsIgnoreCase("Paytm")) {
                    spokenText = "पेटीएम पर " + senderName + " से " + amount + " रुपये प्राप्त हुए";
                } else if (appName.equalsIgnoreCase("Google Pay")) {
                    spokenText = "गूगल पे पर " + senderName + " से " + amount + " रुपये प्राप्त हुए";
                } else if (appName.equalsIgnoreCase("PhonePe")) {
                    spokenText = "फ़ोन पे पर " + senderName + " से " + amount + " रुपये प्राप्त हुए";
                } else {
                    spokenText = appName + " पर " + senderName + " से " + amount + " रुपये प्राप्त हुए";
                }
            } else {
                // Sender name unavailable or setting OFF -> Announce amount only
                if (appName.equalsIgnoreCase("Paytm")) {
                    spokenText = "पेटीएम पर " + amount + " रुपये प्राप्त हुए";
                } else if (appName.equalsIgnoreCase("Google Pay")) {
                    spokenText = "गूगल पे पर " + amount + " रुपये प्राप्त हुए";
                } else if (appName.equalsIgnoreCase("PhonePe")) {
                    spokenText = "फ़ोन पे पर " + amount + " रुपये प्राप्त हुए";
                } else {
                    spokenText = appName + " पर " + amount + " रुपये प्राप्त हुए";
                }
            }

            textToSpeech.speak(spokenText, TextToSpeech.QUEUE_FLUSH, null, "SoundboxAlertId");
        }
    }

    @Override
    public void onDestroy() {
        if (textToSpeech != null) {
            textToSpeech.stop();
            textToSpeech.shutdown();
        }
        super.onDestroy();
    }
}
