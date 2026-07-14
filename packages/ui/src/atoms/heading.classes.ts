import type { HeadingLevel } from './heading.types.js'

export const sizeClass: Record<HeadingLevel, string> = {
  1: 'text-4xl font-bold tracking-tight',
  2: 'text-3xl font-bold',
  3: 'text-2xl font-semibold',
  4: 'text-xl  font-semibold',
  5: 'text-lg  font-medium',
  6: 'text-base font-medium',
}
