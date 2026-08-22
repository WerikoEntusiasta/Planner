// Capacitor configuration for Android APK builds
export interface CapacitorConfig {
  appId: string;
  appName: string;
  webDir: string;
  server?: {
    androidScheme?: string;
    cleartext?: boolean;
    url?: string;
  };
  android?: {
    allowMixedContent?: boolean;
    buildOptions?: {
      keystorePath?: string;
      releaseType?: string;
    };
  };
}

const config: CapacitorConfig = {
  appId: 'com.planner.studio',
  appName: 'Planner Studio',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: true
  },
  android: {
    allowMixedContent: true,
    buildOptions: {
      releaseType: 'APK'
    }
  }
};

export default config;
