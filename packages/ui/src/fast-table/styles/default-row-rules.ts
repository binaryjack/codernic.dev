import type { RowStyleRule } from '../types.js'

export const DEFAULT_ROW_RULES: RowStyleRule<unknown>[] = [
  {
    id:        'dirty',
    condition: r => (r.data as Record<string, unknown>).isDirty === true,
    classes:   'border-l-2 border-yellow-400',
    priority:  5,
  },
  {
    id:        'selected',
    condition: r => r.isSelected,
    classes:   'bg-brand-50 dark:bg-brand-950/60',
    priority:  10,
  },
  {
    id:        'has-errors',
    condition: r => Object.values(r.errors).some(e => (e as unknown[]).length > 0),
    classes:   'bg-red-50/40 dark:bg-red-900/20',
    priority:  15,
  },
  {
    id:        'active',
    condition: r => r.isActive,
    classes:   'ring-2 ring-inset ring-brand-400 z-10 relative',
    priority:  20,
  },
]
