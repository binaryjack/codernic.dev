export const OPTIONS = ['yes', 'no', '—'] as const
export type Option = typeof OPTIONS[number]
