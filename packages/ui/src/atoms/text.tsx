import type { HTMLAttributes, ReactNode } from 'react'
import { cx } from '../lib/cx.js'
import type { TextSize } from '../tokens/index.js'
import { variantClass } from './text.classes.js'
import type { TextVariant } from './text.types.js'

interface TextProps extends HTMLAttributes<HTMLParagraphElement> {
  variant?: TextVariant
  size?:    TextSize
  children: ReactNode
}

export function Text({
  variant   = 'default',
  size      = 'base',
  className = '',
  children,
  ...rest
}: TextProps) {
  return (
    <p
      {...rest}
      className={cx(
        `text-${size}`,
        variantClass[variant],
        className,
      )}
    >
      {children}
    </p>
  )
}
