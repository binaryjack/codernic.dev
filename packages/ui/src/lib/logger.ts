const IS_DEV = import.meta.env ? import.meta.env.DEV : process.env.NODE_ENV !== 'production';

export const logger = {
  info: (...args: any[]) => {
    if (IS_DEV) console.info(...args);
  },
  warn: (...args: any[]) => {
    if (IS_DEV) console.warn(...args);
  },
  error: (...args: any[]) => {
    if (IS_DEV) console.error(...args);
  },
  debug: (...args: any[]) => {
    if (IS_DEV) console.debug(...args);
  }
};
