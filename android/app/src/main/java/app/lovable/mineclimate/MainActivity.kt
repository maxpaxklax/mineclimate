package app.lovable.mineclimate

import android.os.Bundle
import com.getcapacitor.BridgeActivity

class MainActivity : BridgeActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        android.util.Log.d("MainActivity", "=== onCreate starting ===")
        registerPlugin(WidgetBridgePlugin::class.java)
        android.util.Log.d("MainActivity", "WidgetBridgePlugin registered!")
        super.onCreate(savedInstanceState)
        android.util.Log.d("MainActivity", "=== onCreate complete ===")

        // Check if launched from widget with an image URL
        handleWidgetIntent()
    }

    override fun onNewIntent(intent: android.content.Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        handleWidgetIntent()
    }

    private fun handleWidgetIntent() {
        val imageUrl = intent?.getStringExtra("widget_image_url")
        val city = intent?.getStringExtra("widget_city")
        if (imageUrl != null && city != null) {
            android.util.Log.d("MainActivity", "Launched from widget with image: $imageUrl, city: $city")
            // Inject into WebView via JavaScript
            bridge?.webView?.post {
                bridge?.webView?.evaluateJavascript(
                    "window.__WIDGET_IMAGE_URL__ = '$imageUrl'; window.__WIDGET_CITY__ = '$city'; window.dispatchEvent(new Event('widget-image-ready'));",
                    null
                )
            }
            // Clear the extras so it doesn't repeat
            intent?.removeExtra("widget_image_url")
            intent?.removeExtra("widget_city")
        }
    }
}
