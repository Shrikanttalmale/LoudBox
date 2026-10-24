package in.mysoundbox.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.media.AudioManager;
import android.media.ToneGenerator;
import android.os.Build;
import android.os.Bundle;
import android.service.notification.NotificationListenerService;
import android.service.notification.StatusBarNotification;
import android.speech.tts.TextToSpeech;
import android.util.Log;
import androidx.core.app.NotificationCompat;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Native Android Background Notification Listener Service.
 * Runs 24/7 in background even when user closes/swipes away the app.
 * Intercepts incoming UPI payments from GPay, PhonePe, Paytm, BHIM and announces them via TTS.
 */
public class SoundboxNotificationListenerService extends NotificationListenerService implements TextToSpeech.OnInitListener {
    private static final String TAG = "SoundboxListener";
    private static final String CHANNEL_ID = "soundbox_foreground_service_channel";
    private static final int NOTIFICATION_ID = 1001;

    private TextToSpeech textToSpeech;
    private boolean isTtsReady = false;

    // Supported UPI Package Names
    private static final String GPAY_PKG = "com.google.android.apps.nbu.paisa.user";
    private static final String PHONEPE_PKG = "com.phonepe.app";
    private static final String PAYTM_PKG = "net.one97.paytm";
    private static final String BHIM_PKG = "in.org.npci.upiapp";
    private static final String AMAZON_PKG = "in.amazon.mShop.android.shopping";

    @Override
    public void onCreate() {
        super.onCreate();
        Log.d(TAG, "Soundbox Background Service Created");
        initTextToSpeech();
        startForegroundServiceNotification();
    }

    private void initTextToSpeech() {
        textToSpeech = new TextToSpeech(getApplicationContext(), this);
    }

    @Override
    public void onInit(int status) {
        if (status == TextToSpeech.SUCCESS) {
            // Default to Hindi or English based on availability
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
                .setContentText("Monitoring UPI alerts in background (Google Pay, PhonePe, Paytm, BHIM)")
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
        String fullContent = title + " " + text;

        Log.d(TAG, "Notification received from: " + packageName + " | " + fullContent);

        // Check if package is a supported payment app
        String appName = null;
        if (packageName.equals(GPAY_PKG) || fullContent.toLowerCase().contains("google pay") || fullContent.toLowerCase().contains("gpay")) {
            appName = "Google Pay";
        } else if (packageName.equals(PHONEPE_PKG) || fullContent.toLowerCase().contains("phonepe")) {
            appName = "PhonePe";
        } else if (packageName.equals(PAYTM_PKG) || fullContent.toLowerCase().contains("paytm")) {
            appName = "Paytm";
        } else if (packageName.equals(BHIM_PKG) || fullContent.toLowerCase().contains("bhim")) {
            appName = "BHIM UPI";
        } else if (packageName.equals(AMAZON_PKG) && (fullContent.contains("paid") || fullContent.contains("received"))) {
            appName = "Amazon Pay";
        }

        if (appName != null) {
            Double amount = extractAmount(fullContent);
            if (amount != null && amount > 0) {
                announcePaymentAlert(appName, amount.intValue());
            }
        }
    }

    private Double extractAmount(String text) {
        // Regex for ₹, Rs., INR followed by amount
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

    private void announcePaymentAlert(String appName, int amount) {
        Log.i(TAG, "Announcing Payment: " + amount + " on " + appName);

        // Step 1: Play soundbox dual-tone chime
        try {
            ToneGenerator toneGen = new ToneGenerator(AudioManager.STREAM_MUSIC, 100);
            toneGen.startTone(ToneGenerator.TONE_CDMA_ALERT_NETWORK_LITE, 250);
        } catch (Exception e) {
            Log.e(TAG, "Chime error: " + e.getMessage());
        }

        // Step 2: Speak announcement
        if (isTtsReady && textToSpeech != null) {
            String spokenText;
            if (appName.equalsIgnoreCase("Paytm")) {
                spokenText = "पेटीएम पर " + amount + " रुपये प्राप्त हुए";
            } else if (appName.equalsIgnoreCase("Google Pay")) {
                spokenText = "गूगल पे पर " + amount + " रुपये प्राप्त हुए";
            } else if (appName.equalsIgnoreCase("PhonePe")) {
                spokenText = "फ़ोन पे पर " + amount + " रुपये प्राप्त हुए";
            } else {
                spokenText = appName + " पर " + amount + " रुपये प्राप्त हुए";
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
