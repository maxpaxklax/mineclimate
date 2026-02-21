package app.lovable.mineclimate

import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin

@CapacitorPlugin(name = "WidgetBridge")
class WidgetBridgePlugin : Plugin() {

    @PluginMethod
    fun saveLocation(call: PluginCall) {
        android.util.Log.d("WidgetBridge", "=== saveLocation called! ===")
        
        val latitude = call.getDouble("latitude")
        val longitude = call.getDouble("longitude")
        val city = call.getString("city")

        android.util.Log.d("WidgetBridge", "Received: lat=$latitude, lon=$longitude, city=$city")

        if (latitude == null || longitude == null || city == null) {
            android.util.Log.e("WidgetBridge", "Missing required parameters!")
            call.reject("Missing required parameters: latitude, longitude, city")
            return
        }

        val context = activity.applicationContext
        val prefs = context.getSharedPreferences("weather_widget_prefs", Context.MODE_PRIVATE)
        
        prefs.edit().apply {
            putFloat("widget_lat", latitude.toFloat())
            putFloat("widget_lon", longitude.toFloat())
            putString("widget_city", city)
            apply()
        }

        android.util.Log.d("WidgetBridge", "Saved to SharedPreferences successfully!")

        val intent = Intent(context, WeatherWidgetProvider::class.java).apply {
            action = AppWidgetManager.ACTION_APPWIDGET_UPDATE
            val widgetManager = AppWidgetManager.getInstance(context)
            val widgetComponent = ComponentName(context, WeatherWidgetProvider::class.java)
            val widgetIds = widgetManager.getAppWidgetIds(widgetComponent)
            putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, widgetIds)
            android.util.Log.d("WidgetBridge", "Widget IDs to update: ${widgetIds.joinToString()}")
        }
        context.sendBroadcast(intent)

        android.util.Log.d("WidgetBridge", "Widget update broadcast sent!")
        call.resolve()
    }
}