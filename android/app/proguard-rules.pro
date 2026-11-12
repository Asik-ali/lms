# Capacitor
-keep class com.getcapacitor.** { *; }
-keep class com.capacitorjs.** { *; }
-keep class com.cashfree.pg.** { *; }
-dontwarn com.cashfree.pg.**
-keepattributes *Annotation*
-keepattributes JavascriptInterface

# WebView
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Keep source file names for stack traces
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile
