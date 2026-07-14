import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cx } from '../lib/cx.js'
import { sizeClass, variantClass } from './button.classes.js'
import type { ButtonSize, ButtonVariant } from './button.types.js'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:  ButtonVariant
  size?:     ButtonSize
  loading?:  boolean
  children:  ReactNode
}

export function Button({
  variant   = 'primary',
  size      = 'md',
  loading   = false,
  disabled,
  className = '',
  children,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading
  return (
    <button
      {...rest}
      disabled={isDisabled}
      className={cx(
        'inline-flex items-center justify-center gap-1.5',
        'rounded-node border font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
        variantClass[variant],
        sizeClass[size],
        isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
        className,
      )}
    >
      {loading && (
        <span
          className="h-3.5 w-3.5 border-2 border-current border-t-transparent rounded-full animate-spin"
          aria-hidden
        />
      )}
      {children}
    </button>
  )
}
