package com.zing.loudbox;

import android.content.ComponentName;
import android.content.Intent;
import android.os.Bundle;
import android.provider.Settings;
import android.text.TextUtils;
import androidx.core.app.NotificationManagerCompat;
import com.getcapacitor.BridgeActivity;
import java.util.Set;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        checkAndRequestNotificationListenerPermission();
    }

    private void checkAndRequestNotificationListenerPermission() {
        Set<String> packageNames = NotificationManagerCompat.getEnabledListenerPackages(this);
        if (!packageNames.contains(getPackageName())) {
            // Prompt merchant to enable notification access for automatic payment announcements
            Intent intent = new Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS);
            try {
                startActivity(intent);
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
    }
}
