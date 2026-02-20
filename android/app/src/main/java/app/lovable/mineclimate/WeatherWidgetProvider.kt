package app.lovable.mineclimate

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.graphics.drawable.BitmapDrawable
import android.widget.RemoteViews
import androidx.work.*
import coil.ImageLoader
import coil.request.ImageRequest
import coil.request.SuccessResult
import coil.size.Size
import kotlinx.coroutines.*
import org.json.JSONObject
import java.net.URL
import java.util.concurrent.TimeUnit

class WeatherWidgetProvider : AppWidgetProvider() {

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        for (appWidgetId in appWidgetIds) {
            updateWidget(context, appWidgetManager, appWidgetId)
        }

        // Schedule hourly updates
        scheduleWidgetUpdates(context)
    }

    override fun onEnabled(context: Context) {
        super.onEnabled(context)
        scheduleWidgetUpdates(context)
    }

    override fun onDisabled(context: Context) {
        super.onDisabled(context)
        WorkManager.getInstance(context).cancelUniqueWork(WIDGET_WORK_NAME)
    }

    companion object {
        const val WIDGET_WORK_NAME = "weather_widget_update"
        const val PREFS_NAME = "weather_widget_prefs"
        const val PREF_CITY = "widget_city"
        const val PREF_LAT = "widget_lat"
        const val PREF_LON = "widget_lon"
        const val PREF_LAST_TEMP = "widget_last_temp"
        const val PREF_LAST_CONDITION = "widget_last_condition"
        const val PREF_LAST_IMAGE_URL = "widget_last_image_url"

        fun updateWidget(
            context: Context,
            appWidgetManager: AppWidgetManager,
            appWidgetId: Int
        ) {
            val views = RemoteViews(context.packageName, R.layout.weather_widget)

            // Set click intent to open app
            val intent = Intent(context, MainActivity::class.java)
            val pendingIntent = PendingIntent.getActivity(
                context, 0, intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            views.setOnClickPendingIntent(R.id.widget_container, pendingIntent)

            // Load cached data first
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val city = prefs.getString(PREF_CITY, "Loading...") ?: "Loading..."
            val temp = prefs.getInt(PREF_LAST_TEMP, 0)
            val condition = prefs.getString(PREF_LAST_CONDITION, "cloudy") ?: "cloudy"
            val lat = prefs.getFloat(PREF_LAT, 0f)
            val lon = prefs.getFloat(PREF_LON, 0f)

            android.util.Log.d("WeatherWidget", "Cached data - city: $city, lat: $lat, lon: $lon, temp: $temp")

            views.setTextViewText(R.id.widget_city_name, city)
            views.setTextViewText(R.id.widget_temperature, if (lat != 0f) "${temp}°C" else "Open app")
            views.setImageViewResource(R.id.widget_weather_icon, getWeatherIcon(condition))

            // Update widget with cached data immediately
            appWidgetManager.updateAppWidget(appWidgetId, views)

            // Fetch fresh data in background
            CoroutineScope(Dispatchers.IO).launch {
                try {
                    val savedCity = prefs.getString(PREF_CITY, null)
                    android.util.Log.d("WeatherWidget", "Checking: lat=$lat, lon=$lon, city=$savedCity")

                    if (lat != 0f && lon != 0f && savedCity != null && savedCity != "Loading...") {
                        android.util.Log.d("WeatherWidget", "Fetching fresh data for $savedCity")
                        fetchAndUpdateWidget(context, appWidgetManager, appWidgetId, lat, lon, savedCity)
                    } else {
                        android.util.Log.d("WeatherWidget", "No location saved, showing 'Open app' message")
                    }
                } catch (e: Exception) {
                    android.util.Log.e("WeatherWidget", "Error updating widget", e)
                    e.printStackTrace()
                }
            }
        }

        private suspend fun fetchAndUpdateWidget(
            context: Context,
            appWidgetManager: AppWidgetManager,
            appWidgetId: Int,
            lat: Float,
            lon: Float,
            city: String
        ) {
            try {
                val apiUrl = "https://hyivlornvmsurgcjlbal.supabase.co/functions/v1/widget-data?lat=$lat&lon=$lon&city=$city"
                val response = URL(apiUrl).readText()
                val json = JSONObject(response)

                val temperature = json.getInt("temperature")
                val condition = json.getString("condition")
                val imageUrl = if (json.isNull("imageUrl")) null else json.getString("imageUrl")

                // Save to prefs
                val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
                prefs.edit().apply {
                    putInt(PREF_LAST_TEMP, temperature)
                    putString(PREF_LAST_CONDITION, condition)
                    if (imageUrl != null) putString(PREF_LAST_IMAGE_URL, imageUrl)
                    apply()
                }

                // Update views
                val views = RemoteViews(context.packageName, R.layout.weather_widget)
                views.setTextViewText(R.id.widget_city_name, city)
                views.setTextViewText(R.id.widget_temperature, "${temperature}°C")
                views.setImageViewResource(R.id.widget_weather_icon, getWeatherIcon(condition))

                // Load image if available
                if (imageUrl != null) {
                    try {
                        val imageLoader = ImageLoader(context)
                        val request = ImageRequest.Builder(context)
                            .data(imageUrl)
                            .size(800, 400)       // Scale down to stay under RemoteViews' ~1MB bitmap limit
                            .allowHardware(false) // Must be false so the bitmap can be extracted and passed to RemoteViews
                            .build()

                        val result = imageLoader.execute(request)
                        if (result is SuccessResult) {
                            val bitmap = (result.drawable as BitmapDrawable).bitmap
                            views.setImageViewBitmap(R.id.widget_city_image, bitmap)
                            android.util.Log.d("WeatherWidget", "Image loaded successfully: ${bitmap.width}x${bitmap.height}")
                        } else {
                            android.util.Log.e("WeatherWidget", "Image load did not succeed: $result")
                        }
                    } catch (e: Exception) {
                        android.util.Log.e("WeatherWidget", "Image loading exception", e)
                    }
                }

                // Set click intent
                val intent = Intent(context, MainActivity::class.java)
                val pendingIntent = PendingIntent.getActivity(
                    context, 0, intent,
                    PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
                )
                views.setOnClickPendingIntent(R.id.widget_container, pendingIntent)

                withContext(Dispatchers.Main) {
                    appWidgetManager.updateAppWidget(appWidgetId, views)
                }

            } catch (e: Exception) {
                android.util.Log.e("WeatherWidget", "fetchAndUpdateWidget exception", e)
                e.printStackTrace()
            }
        }

        private fun getWeatherIcon(condition: String): Int {
            return when (condition) {
                "sunny" -> R.drawable.ic_weather_sunny
                "cloudy" -> R.drawable.ic_weather_cloudy
                "rainy" -> R.drawable.ic_weather_rainy
                "snowy" -> R.drawable.ic_weather_snowy
                "stormy" -> R.drawable.ic_weather_stormy
                "foggy" -> R.drawable.ic_weather_foggy
                else -> R.drawable.ic_weather_cloudy
            }
        }

        private fun scheduleWidgetUpdates(context: Context) {
            val constraints = Constraints.Builder()
                .setRequiredNetworkType(NetworkType.CONNECTED)
                .build()

            val workRequest = PeriodicWorkRequestBuilder<WidgetUpdateWorker>(1, TimeUnit.HOURS)
                .setConstraints(constraints)
                .build()

            WorkManager.getInstance(context).enqueueUniquePeriodicWork(
                WIDGET_WORK_NAME,
                ExistingPeriodicWorkPolicy.KEEP,
                workRequest
            )
        }
    }
}
