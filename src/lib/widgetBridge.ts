import { Capacitor, registerPlugin } from '@capacitor/core';

interface WidgetBridgePlugin {
  saveLocation(options: {
    latitude: number;
    longitude: number;
    city: string;
  }): Promise<void>;
}

const WidgetBridge = registerPlugin<WidgetBridgePlugin>('WidgetBridge');

export const saveLocationToWidget = async (
  latitude: number,
  longitude: number,
  city: string
): Promise<void> => {
  const platform = Capacitor.getPlatform();
  console.log('[WidgetBridge] Platform:', platform);
  console.log('[WidgetBridge] Attempting to save:', { latitude, longitude, city });

  // Only run on native Android
  if (platform !== 'android') {
    console.log('[WidgetBridge] Not on Android, skipping widget update');
    return;
  }

  try {
    console.log('[WidgetBridge] Calling native saveLocation...');
    await WidgetBridge.saveLocation({ latitude, longitude, city });
    console.log('[WidgetBridge] SUCCESS - Location saved for widget:', city);
  } catch (error) {
    console.error('[WidgetBridge] FAILED to save location:', error);
  }
};
