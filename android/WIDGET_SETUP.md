# Android Widget Setup - Step by Step

After syncing your project with `npx cap sync android`, the Kotlin widget files need to be manually copied because Capacitor only syncs web assets, not native code.

## Quick Setup (Copy-Paste Commands)

Run these commands from your **local project root** (where you cloned from GitHub):

### Step 1: Copy Kotlin Files

```bash
# Create the package directory if it doesn't exist
mkdir -p android/app/src/main/java/app/lovable/mineclimate

# The Kotlin files should already be in the android folder from git
# If not, you need to copy them from the Lovable project
```

**Verify these files exist in `android/app/src/main/java/app/lovable/mineclimate/`:**
- `MainActivity.kt`
- `WidgetBridgePlugin.kt`
- `WeatherWidgetProvider.kt`
- `WidgetUpdateWorker.kt`

### Step 2: Copy Resource Files

**Verify these exist:**
- `android/app/src/main/res/layout/weather_widget.xml`
- `android/app/src/main/res/xml/weather_widget_info.xml`
- `android/app/src/main/res/drawable/ic_weather_sunny.xml`
- `android/app/src/main/res/drawable/ic_weather_cloudy.xml`
- `android/app/src/main/res/drawable/ic_weather_rainy.xml`
- `android/app/src/main/res/drawable/ic_weather_snowy.xml`
- `android/app/src/main/res/drawable/ic_weather_stormy.xml`
- `android/app/src/main/res/drawable/ic_weather_foggy.xml`
- `android/app/src/main/res/drawable/widget_background.xml`
- `android/app/src/main/res/drawable/widget_gradient_overlay.xml`

### Step 3: Update AndroidManifest.xml

Open `android/app/src/main/AndroidManifest.xml` and add this **inside** the `<application>` tag (before `</application>`):

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

### Step 4: Update MainActivity.kt

Make sure `android/app/src/main/java/app/lovable/mineclimate/MainActivity.kt` contains:

```kotlin
package app.lovable.mineclimate

import android.os.Bundle
import com.getcapacitor.BridgeActivity

class MainActivity : BridgeActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        registerPlugin(WidgetBridgePlugin::class.java)
        super.onCreate(savedInstanceState)
    }
}
```

### Step 5: Update build.gradle (App Level)

Open `android/app/build.gradle` and add these inside the `dependencies { }` block:

```gradle
// Widget dependencies
implementation 'io.coil-kt:coil:2.5.0'
implementation 'androidx.work:work-runtime-ktx:2.9.0'
implementation 'org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3'
```

### Step 6: Sync and Build

```bash
# Sync the project
npx cap sync android

# Open in Android Studio
npx cap open android
```

In Android Studio:
1. Click **File → Sync Project with Gradle Files**
2. Click **Build → Rebuild Project**
3. Click the **Run ▶️** button

### Step 7: Add Widget to Home Screen

1. Long-press on your Android home screen
2. Select "Widgets"
3. Find "MineClimate Weather"
4. Drag the widget to your home screen
5. Open the app and select a city - the widget will update!

## Troubleshooting

### "WidgetBridge plugin is not implemented on android"
- Make sure `registerPlugin(WidgetBridgePlugin::class.java)` is in MainActivity.kt
- Make sure WidgetBridgePlugin.kt exists in the correct package folder

### "ClassNotFoundException: WeatherWidgetProvider"
- The Kotlin files aren't in the build. Verify they're in:
  `android/app/src/main/java/app/lovable/mineclimate/`
- Do a **Build → Clean Project** then **Build → Rebuild Project**

### Widget shows "Loading..."
- Open the app first and select a city
- The widget needs location data saved to SharedPreferences

### Widget doesn't show image
- Make sure the city has been viewed in the app (so an image was generated)
- Check that the widget-data edge function is deployed
