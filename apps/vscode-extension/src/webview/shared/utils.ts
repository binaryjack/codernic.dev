/** Truncate a string to `max` chars, appending … if longer. */
export const trunc = (s: string, max = 60): string => (s.length > max ? s.slice(0, max) + '…' : s);
