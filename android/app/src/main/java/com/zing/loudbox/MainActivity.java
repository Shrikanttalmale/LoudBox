package com.zing.loudbox;

import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.os.PowerManager;
import android.provider.Settings;
import androidx.core.app.NotificationManagerCompat;
import com.getcapacitor.BridgeActivity;
import java.util.Set;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(LoudboxPermissionsPlugin.class);
        super.onCreate(savedInstanceState);
        // Note: We do NOT force open Android Notification Settings on cold launch here!
        // Instead, the user is properly shown an explanation during the in-app onboarding setup
        // and can tap to grant permission at that step.
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
