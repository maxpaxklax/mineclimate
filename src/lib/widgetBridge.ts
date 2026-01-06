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
  // Only run on native Android
  if (Capacitor.getPlatform() !== 'android') {
    console.log('[WidgetBridge] Not on Android, skipping widget update');
    return;
  }

  try {
    await WidgetBridge.saveLocation({ latitude, longitude, city });
    console.log('[WidgetBridge] Location saved for widget:', city);
  } catch (error) {
    console.error('[WidgetBridge] Failed to save location:', error);
  }
};
