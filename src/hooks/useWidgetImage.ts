import { useState, useEffect, useCallback } from 'react';

declare global {
  interface Window {
    __WIDGET_IMAGE_URL__?: string;
    __WIDGET_CITY__?: string;
  }
}

interface WidgetImageData {
  imageUrl: string;
  city: string;
}

/**
 * Listens for image URL passed from the Android widget via MainActivity.
 * When the user taps the widget, the native side injects the current
 * widget image URL into the WebView so the app can display it
 * instead of regenerating.
 */
export function useWidgetImage() {
  const [widgetImage, setWidgetImage] = useState<WidgetImageData | null>(() => {
    // Check if already set before React mounted
    if (window.__WIDGET_IMAGE_URL__ && window.__WIDGET_CITY__) {
      return {
        imageUrl: window.__WIDGET_IMAGE_URL__,
        city: window.__WIDGET_CITY__,
      };
    }
    return null;
  });

  useEffect(() => {
    const handler = () => {
      if (window.__WIDGET_IMAGE_URL__ && window.__WIDGET_CITY__) {
        console.log('[WidgetImage] Received image from widget:', window.__WIDGET_CITY__);
        setWidgetImage({
          imageUrl: window.__WIDGET_IMAGE_URL__,
          city: window.__WIDGET_CITY__,
        });
        // Clean up globals
        delete window.__WIDGET_IMAGE_URL__;
        delete window.__WIDGET_CITY__;
      }
    };

    window.addEventListener('widget-image-ready', handler);
    return () => window.removeEventListener('widget-image-ready', handler);
  }, []);

  const clearWidgetImage = useCallback(() => {
    setWidgetImage(null);
  }, []);

  return { widgetImage, clearWidgetImage };
}
