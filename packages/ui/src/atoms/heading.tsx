import type { HTMLAttributes, ReactNode } from 'react'
import { cx } from '../lib/cx.js'
import { sizeClass } from './heading.classes.js'
import type { HeadingLevel } from './heading.types.js'

interface HeadingProps extends HTMLAttributes<HTMLHeadingElement> {
  level?:    HeadingLevel
  children:  ReactNode
}

export function Heading({ level = 2, children, className = '', ...rest }: HeadingProps) {
  const Tag = `h${level}` as const
  return (
    <Tag
      {...rest}
      className={cx(
        sizeClass[level],
        'text-neutral-900 dark:text-neutral-50',
        className,
      )}
    >
      {children}
    </Tag>
  )
}
