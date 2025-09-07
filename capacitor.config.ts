import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.033832917fdc43ac8201828a5978b1ea',
  appName: 'cine-craft-android',
  webDir: 'dist',
  server: {
    url: 'https://03383291-7fdc-43ac-8201-828a5978b1ea.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    Camera: {
      permissions: [
        'camera',
        'read_external_storage',
        'write_external_storage'
      ]
    },
    Filesystem: {
      permissions: [
        'read_external_storage',
        'write_external_storage'
      ]
    }
  },
  android: {
    allowMixedContent: true,
    permissions: [
      'android.permission.CAMERA',
      'android.permission.RECORD_AUDIO',
      'android.permission.READ_EXTERNAL_STORAGE',
      'android.permission.WRITE_EXTERNAL_STORAGE',
      'android.permission.MANAGE_EXTERNAL_STORAGE'
    ]
  }
};

export default config;