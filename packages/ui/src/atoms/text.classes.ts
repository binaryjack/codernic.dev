import type { TextVariant } from './text.types.js'

export const variantClass: Record<TextVariant, string> = {
  default: 'text-neutral-800 dark:text-neutral-200',
  muted:   'text-neutral-500 dark:text-neutral-400',
  danger:  'text-danger-700  dark:text-danger-500',
  success: 'text-success-700 dark:text-success-500',
}
