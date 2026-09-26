import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'app.nouricircle.mobile',
  appName: 'NouriCircle',
  webDir: 'dist',
  android: { path: 'mobile/android' },
  ios: { path: 'mobile/ios' },
  plugins: {
    Camera: { permissions: ['camera', 'photos'] },
  },
}

export default config
