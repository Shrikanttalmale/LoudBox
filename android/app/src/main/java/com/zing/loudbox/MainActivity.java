package com.zing.loudbox;

import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.os.PowerManager;
import android.provider.Settings;
import android.speech.tts.TextToSpeech;
import android.util.Log;
import androidx.core.app.NotificationManagerCompat;
import com.getcapacitor.BridgeActivity;
import java.util.Locale;
import java.util.Set;

public class MainActivity extends BridgeActivity implements TextToSpeech.OnInitListener {
    private static final String TAG = "LoudboxMainActivity";
    private TextToSpeech textToSpeech;
    public boolean isTtsReady = false;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(LoudboxPermissionsPlugin.class);
        super.onCreate(savedInstanceState);
        initNativeTTS();
    }

    private void initNativeTTS() {
        try {
            textToSpeech = new TextToSpeech(this, this);
        } catch (Exception e) {
            Log.e(TAG, "Failed to initialize native TTS: " + e.getMessage());
        }
    }

    @Override
    public void onInit(int status) {
        if (status == TextToSpeech.SUCCESS) {
            isTtsReady = true;
            Log.d(TAG, "Native TextToSpeech initialized in MainActivity");
            try {
                textToSpeech.setLanguage(new Locale("hi", "IN"));
            } catch (Exception ignored) {}
        } else {
            Log.e(TAG, "Native TextToSpeech initialization failed: " + status);
        }
    }

    public boolean speakNative(String text, String langCode, float rate, float pitch) {
        if (text == null || text.trim().isEmpty()) {
            return false;
        }

        if (textToSpeech == null) {
            initNativeTTS();
        }

        try {
            Locale targetLocale = getLocaleForCode(langCode);
            int langResult = textToSpeech.setLanguage(targetLocale);
            if (langResult == TextToSpeech.LANG_MISSING_DATA || langResult == TextToSpeech.LANG_NOT_SUPPORTED) {
                // Regional languages fallback to Hindi Devanagari or Indian English
                langResult = textToSpeech.setLanguage(new Locale("hi", "IN"));
                if (langResult == TextToSpeech.LANG_MISSING_DATA || langResult == TextToSpeech.LANG_NOT_SUPPORTED) {
                    textToSpeech.setLanguage(new Locale("en", "IN"));
                }
            }

            textToSpeech.setSpeechRate(rate > 0 ? rate : 1.0f);
            textToSpeech.setPitch(pitch > 0 ? pitch : 1.0f);

            int res;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                res = textToSpeech.speak(text, TextToSpeech.QUEUE_FLUSH, null, "LoudboxAppAlert_" + System.currentTimeMillis());
            } else {
                res = textToSpeech.speak(text, TextToSpeech.QUEUE_FLUSH, null);
            }
            return res == TextToSpeech.SUCCESS;
        } catch (Exception e) {
            Log.e(TAG, "speakNative error: " + e.getMessage());
            return false;
        }
    }

    private Locale getLocaleForCode(String code) {
        if (code == null) return new Locale("hi", "IN");
        String lower = code.toLowerCase().replace("_", "-");
        if (lower.startsWith("mr")) return new Locale("mr", "IN");
        if (lower.startsWith("hi")) return new Locale("hi", "IN");
        if (lower.startsWith("gu")) return new Locale("gu", "IN");
        if (lower.startsWith("ta")) return new Locale("ta", "IN");
        if (lower.startsWith("te")) return new Locale("te", "IN");
        if (lower.startsWith("kn")) return new Locale("kn", "IN");
        if (lower.startsWith("bn")) return new Locale("bn", "IN");
        if (lower.startsWith("pa")) return new Locale("pa", "IN");
        if (lower.startsWith("ml")) return new Locale("ml", "IN");
        if (lower.startsWith("or")) return new Locale("or", "IN");
        if (lower.startsWith("as")) return new Locale("as", "IN");
        if (lower.startsWith("en")) return new Locale("en", "IN");
        return new Locale("hi", "IN");
    }

    public void stopNativeTTS() {
        if (textToSpeech != null) {
            try {
                textToSpeech.stop();
            } catch (Exception ignored) {}
        }
    }

    @Override
    public void onDestroy() {
        if (textToSpeech != null) {
            try {
                textToSpeech.stop();
                textToSpeech.shutdown();
            } catch (Exception ignored) {}
        }
        super.onDestroy();
    }

    @Override
    public void onStart() {
        super.onStart();
        setupWebViewInterface();
    }

    private void setupWebViewInterface() {
        if (getBridge() != null && getBridge().getWebView() != null) {
            getBridge().getWebView().addJavascriptInterface(new LoudboxNativeBridge(this), "LoudboxAndroid");
        }
    }

    public static class LoudboxNativeBridge {
        private final Context context;

        public LoudboxNativeBridge(Context context) {
            this.context = context;
        }

        @android.webkit.JavascriptInterface
        public boolean speakText(String text, String langCode, float rate, float pitch) {
            if (context instanceof MainActivity) {
                return ((MainActivity) context).speakNative(text, langCode, rate, pitch);
            }
            return false;
        }

        @android.webkit.JavascriptInterface
        public void stopSpeaking() {
            if (context instanceof MainActivity) {
                ((MainActivity) context).stopNativeTTS();
            }
        }

        @android.webkit.JavascriptInterface
        public boolean isNativeTtsAvailable() {
            if (context instanceof MainActivity) {
                return ((MainActivity) context).isTtsReady;
            }
            return false;
        }

        @android.webkit.JavascriptInterface
        public boolean isNotificationListenerEnabled() {
            try {
                Set<String> packageNames = NotificationManagerCompat.getEnabledListenerPackages(context);
                return packageNames.contains(context.getPackageName());
            } catch (Exception e) {
                return false;
            }
        }

        @android.webkit.JavascriptInterface
        public void openNotificationSettings() {
            try {
                Intent intent = new Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS);
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                context.startActivity(intent);
            } catch (Exception e) {
                e.printStackTrace();
            }
        }

        @android.webkit.JavascriptInterface
        public boolean isIgnoringBatteryOptimizations() {
            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    PowerManager pm = (PowerManager) context.getSystemService(Context.POWER_SERVICE);
                    return pm != null && pm.isIgnoringBatteryOptimizations(context.getPackageName());
                }
                return true;
            } catch (Exception e) {
                return false;
            }
        }

        @android.webkit.JavascriptInterface
        public void openBatteryOptimizationSettings() {
            try {
                Intent intent;
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    intent = new Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS);
                } else {
                    intent = new Intent(Settings.ACTION_SETTINGS);
                }
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                context.startActivity(intent);
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
    }
}
