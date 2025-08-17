import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.033832917fdc43ac8201828a5978b1ea',
  appName: 'CinePro Camera',
  webDir: 'dist',
  server: {
    url: 'https://03383291-7fdc-43ac-8201-828a5978b1ea.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    Camera: {
      permissions: ['camera', 'photos']
    }
  }
};

export default config;