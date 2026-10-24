# Add project specific ProGuard rules here.
# Keep Capacitor and Cordova classes
-keep class com.getcapacitor.** { *; }
-keep class com.getcapacitor.community.** { *; }
-keep interface com.getcapacitor.** { *; }
-keepattributes JavascriptInterface
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Keep Soundbox Native Services & Activities
-keep class in.mysoundbox.app.** { *; }
-keepclassmembers class in.mysoundbox.app.** { *; }

# Keep Android NotificationListenerService & Speech TTS
-keep class android.service.notification.NotificationListenerService { *; }
-keep class android.speech.tts.** { *; }

# Preserve line numbers and source file names for crash reporting
-keepattributes SourceFile,LineNumberTable
