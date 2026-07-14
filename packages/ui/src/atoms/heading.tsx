import type { HTMLAttributes, ReactNode } from 'react'
import { cx } from '../lib/cx.js'
import { sizeClass } from './heading.classes.js'
import type { HeadingLevel } from './heading.types.js'
import { useTestId } from '../hooks/useTestId';

interface HeadingProps extends HTMLAttributes<HTMLHeadingElement> {
  level?:    HeadingLevel
  children:  ReactNode
  dataTestId?: string;
}

export function Heading({ dataTestId, level = 2, children, className = '', ...rest }: HeadingProps) {
  
  const { rootId, getTestId } = useTestId('heading', dataTestId);
const Tag = `h${level}` as const
  return (
    <Tag data-testid={getTestId('tag')}
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
