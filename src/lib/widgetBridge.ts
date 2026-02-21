import { Capacitor, registerPlugin } from '@capacitor/core';

interface WidgetBridgePlugin {
  saveLocation(options: {
    latitude: number;
    longitude: number;
    city: string;
  }): Promise<void>;
}

const WidgetBridge = registerPlugin<WidgetBridgePlugin>('WidgetBridge');

// Enhanced platform detection with multiple fallbacks
const isNativeAndroid = (): boolean => {
  const platform = Capacitor.getPlatform();
  const isNative = Capacitor.isNativePlatform();
  const isPluginAvailable = Capacitor.isPluginAvailable('WidgetBridge');
  
  console.log('[WidgetBridge] Platform detection:', {
    platform,
    isNative,
    isPluginAvailable,
    userAgent: navigator?.userAgent?.substring(0, 50)
  });

  // Method 1: Standard Capacitor check
  if (platform === 'android') return true;
  
  // Method 2: Check if native plugin is available
  if (isPluginAvailable) return true;
  
  // Method 3: Native platform + Android user agent
  if (isNative && /android/i.test(navigator?.userAgent || '')) return true;
  
  return false;
};

export const saveLocationToWidget = async (
  latitude: number,
  longitude: number,
  city: string
): Promise<void> => {
  console.log('[WidgetBridge] === saveLocationToWidget called ===');
  console.log('[WidgetBridge] Data:', { latitude, longitude, city });

  const shouldCallNative = isNativeAndroid();
  console.log('[WidgetBridge] Should call native:', shouldCallNative);

  if (!shouldCallNative) {
    console.log('[WidgetBridge] Not on native Android, skipping widget update');
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
