import type { ButtonSize, ButtonVariant } from './button.types.js'

export const variantClass: Record<ButtonVariant, string> = {
  primary:   'bg-brand-500 hover:bg-brand-600 text-white border-transparent',
  secondary: 'bg-white dark:bg-neutral-800 hover:bg-neutral-50 text-neutral-800 dark:text-neutral-100 border-neutral-300 dark:border-neutral-600',
  ghost:     'bg-transparent hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-transparent',
  danger:    'bg-danger-500 hover:bg-danger-600 text-white border-transparent',
}

export const sizeClass: Record<ButtonSize, string> = {
  sm: 'px-2.5 py-1   text-xs',
  md: 'px-4   py-1.5 text-sm',
  lg: 'px-6   py-2   text-base',
  icon: 'p-1.5 flex items-center justify-center',
}
