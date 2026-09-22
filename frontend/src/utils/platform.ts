// True when running inside the iOS/Android app shell (Capacitor) rather than a browser.
export const isNativeApp = (): boolean =>
  typeof window !== 'undefined' && !!(window as any).Capacitor?.isNativePlatform?.();
