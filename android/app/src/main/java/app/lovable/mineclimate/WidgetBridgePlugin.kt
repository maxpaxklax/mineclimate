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
        val latitude = call.getDouble("latitude")
        val longitude = call.getDouble("longitude")
        val city = call.getString("city")

        if (latitude == null || longitude == null || city == null) {
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

        // Trigger widget update
        val intent = Intent(context, WeatherWidgetProvider::class.java).apply {
            action = AppWidgetManager.ACTION_APPWIDGET_UPDATE
            val widgetManager = AppWidgetManager.getInstance(context)
            val widgetComponent = ComponentName(context, WeatherWidgetProvider::class.java)
            val widgetIds = widgetManager.getAppWidgetIds(widgetComponent)
            putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, widgetIds)
        }
        context.sendBroadcast(intent)

        call.resolve()
    }
}
