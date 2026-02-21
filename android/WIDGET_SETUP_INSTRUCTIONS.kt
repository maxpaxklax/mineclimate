// This file documents the required AndroidManifest.xml changes for the weather widget
// These changes need to be added to android/app/src/main/AndroidManifest.xml after running `npx cap add android`

/*
Add inside the <application> tag:

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

<!-- WorkManager Initialization -->
<provider
    android:name="androidx.startup.InitializationProvider"
    android:authorities="${applicationId}.androidx-startup"
    android:exported="false"
    tools:node="merge">
    <meta-data
        android:name="androidx.work.WorkManagerInitializer"
        android:value="androidx.startup" />
</provider>
*/

// Also add these dependencies to android/app/build.gradle:
/*
dependencies {
    // ... existing dependencies ...
    
    // For widget image loading
    implementation 'io.coil-kt:coil:2.5.0'
    
    // For background updates
    implementation 'androidx.work:work-runtime-ktx:2.9.0'
    
    // Coroutines
    implementation 'org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3'
}
*/
