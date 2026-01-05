# Android Widget Setup Instructions

After exporting to GitHub and cloning locally, follow these steps:

## 1. Install Dependencies & Add Android Platform

```bash
npm install
npx cap add android
npx cap sync
```

## 2. Update AndroidManifest.xml

Open `android/app/src/main/AndroidManifest.xml` and add inside the `<application>` tag:

```xml
<!-- Weather Widget Provider -->
<receiver
    android:name=".WeatherWidgetProvider"
    android:exported="true">
    <intent-filter>
        <action android:name="android.appwidget.action.APPWIDGET_UPDATE" />
    </intent-filter>
    <meta-data
        android:name="android.appwidget.provider"
        android:resource="@xml/weather_widget_info" />
</receiver>
```

## 3. Update build.gradle

Open `android/app/build.gradle` and add these dependencies:

```gradle
dependencies {
    // ... existing dependencies ...
    
    // For widget image loading
    implementation 'io.coil-kt:coil:2.5.0'
    
    // For background updates
    implementation 'androidx.work:work-runtime-ktx:2.9.0'
    
    // Coroutines
    implementation 'org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3'
}
```

## 4. Save Location on App Launch

The widget needs the user's location saved to SharedPreferences. This happens automatically when the app is opened and location is granted.

You'll need to add this to your MainActivity or a dedicated Android code to save location:

```kotlin
// Save location to SharedPreferences when received from the WebView
val prefs = getSharedPreferences("weather_widget_prefs", Context.MODE_PRIVATE)
prefs.edit().apply {
    putFloat("widget_lat", latitude)
    putFloat("widget_lon", longitude)
    putString("widget_city", cityName)
    apply()
}
```

## 5. Build and Run

```bash
npx cap run android
```

## 6. Add Widget to Home Screen

1. Long-press on your Android home screen
2. Select "Widgets"
3. Find "MineClimate" 
4. Drag the weather widget to your home screen

## Notes

- The widget updates every hour via WorkManager
- It displays the AI-generated city image from Supabase Storage
- Tapping the widget opens the full app
- The widget shows cached data immediately, then fetches fresh data in the background
