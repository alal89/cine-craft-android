/**
 * Logger utility for development and production
 * Automatically disables logs in production builds
 */

const isDevelopment = import.meta.env.DEV;

export const logger = {
  log: (...args: any[]) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },
  
  error: (...args: any[]) => {
    console.error(...args); // Always log errors
  },
  
  warn: (...args: any[]) => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },
  
  debug: (...args: any[]) => {
    if (isDevelopment) {
      console.debug(...args);
    }
  },
  
  trace: (...args: any[]) => {
    if (isDevelopment) {
      console.trace(...args);
    }
  }
};

// Camera-specific logger with emojis for easy identification
export const cameraLogger = {
  init: (message: string, ...args: any[]) => logger.log('🎥', message, ...args),
  error: (message: string, ...args: any[]) => logger.error('❌ Camera:', message, ...args),
  success: (message: string, ...args: any[]) => logger.log('✅ Camera:', message, ...args),
  zoom: (message: string, ...args: any[]) => logger.log('🔍 Zoom:', message, ...args),
  recording: (message: string, ...args: any[]) => logger.log('📹 Recording:', message, ...args),
  settings: (message: string, ...args: any[]) => logger.log('⚙️ Settings:', message, ...args)
};