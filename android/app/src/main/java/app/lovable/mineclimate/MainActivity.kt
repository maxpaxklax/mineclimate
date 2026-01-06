package app.lovable.mineclimate

import android.os.Bundle
import com.getcapacitor.BridgeActivity

class MainActivity : BridgeActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        android.util.Log.d("MainActivity", "=== onCreate starting ===")
        // Register the WidgetBridge plugin before super.onCreate()
        registerPlugin(WidgetBridgePlugin::class.java)
        android.util.Log.d("MainActivity", "WidgetBridgePlugin registered!")
        super.onCreate(savedInstanceState)
        android.util.Log.d("MainActivity", "=== onCreate complete ===")
    }
}
