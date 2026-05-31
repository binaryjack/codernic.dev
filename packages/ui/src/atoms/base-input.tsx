import type { InputHTMLAttributes } from 'react'
import { Skeleton } from './skeleton.js'

interface BaseInputProps extends InputHTMLAttributes<HTMLInputElement> {
  isLoading?: boolean
}

export function BaseInput({
  isLoading = false,
  type      = 'text',
  className,
  ...props
}: Readonly<BaseInputProps>) {
  if (isLoading) {
    const skeletonClass = type === 'checkbox'
      ? 'h-4 w-4 rounded'
      : 'h-8 w-full rounded-node'
    return <Skeleton className={skeletonClass} />
  }

  return <input type={type} className={className} {...props} />
}
