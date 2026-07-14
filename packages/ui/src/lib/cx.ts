type ClassValue = string | false | null | undefined | 0

export const cx = (...args: ClassValue[]): string =>
  args.filter(Boolean).join(' ')
