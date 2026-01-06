import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.mineclimate',
  appName: 'mineclimate',
  webDir: 'dist',
  server: {
    url: 'https://7d3f3227-85bc-426a-8847-a66f12db1c40.lovableproject.com?forceHideBadge=true',
    cleartext: true
  }
};

export default config;
