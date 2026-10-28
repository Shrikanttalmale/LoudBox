package com.zing.loudbox;

import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.PowerManager;
import android.provider.Settings;
import androidx.core.app.NotificationManagerCompat;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.util.Set;

@CapacitorPlugin(name = "LoudboxPermissions")
public class LoudboxPermissionsPlugin extends Plugin {

    @PluginMethod
    public void checkNotificationPermission(PluginCall call) {
        JSObject ret = new JSObject();
        try {
            Set<String> packageNames = NotificationManagerCompat.getEnabledListenerPackages(getContext());
            boolean isGranted = packageNames.contains(getContext().getPackageName());
            ret.put("isGranted", isGranted);
            call.resolve(ret);
        } catch (Exception e) {
            ret.put("isGranted", false);
            call.resolve(ret);
        }
    }

    @PluginMethod
    public void openNotificationSettings(PluginCall call) {
        JSObject ret = new JSObject();
        try {
            Intent intent = new Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(intent);
            ret.put("success", true);
            call.resolve(ret);
        } catch (Exception e) {
            ret.put("success", false);
            ret.put("error", e.getMessage());
            call.resolve(ret);
        }
    }

    @PluginMethod
    public void checkBatteryOptimization(PluginCall call) {
        JSObject ret = new JSObject();
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                PowerManager pm = (PowerManager) getContext().getSystemService(Context.POWER_SERVICE);
                boolean isIgnoring = pm != null && pm.isIgnoringBatteryOptimizations(getContext().getPackageName());
                ret.put("isIgnoring", isIgnoring);
            } else {
                ret.put("isIgnoring", true);
            }
            call.resolve(ret);
        } catch (Exception e) {
            ret.put("isIgnoring", false);
            call.resolve(ret);
        }
    }

    @PluginMethod
    public void openBatterySettings(PluginCall call) {
        JSObject ret = new JSObject();
        try {
            Intent intent;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                intent = new Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS);
            } else {
                intent = new Intent(Settings.ACTION_SETTINGS);
            }
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(intent);
            ret.put("success", true);
            call.resolve(ret);
        } catch (Exception e) {
            ret.put("success", false);
            ret.put("error", e.getMessage());
            call.resolve(ret);
        }
    }
}
