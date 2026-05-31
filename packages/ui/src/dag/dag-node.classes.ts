import type { IconName } from '../icons/index.js'
import type { DagNodeKind } from './types.js'

export const kindBorder: Record<DagNodeKind, string> = {
  worker:     'border-brand-400',
  supervisor: 'border-warning-500',
  lane:       'border-neutral-400',
  trigger:    'border-success-500',
  budget:     'border-danger-400',
  barrier:    'border-purple-400',
}

export const kindIcon: Record<DagNodeKind, IconName> = {
  worker:     'worker',
  supervisor: 'supervisor',
  lane:       'branching',
  trigger:    'trigger',
  budget:     'budget',
  barrier:    'sync',
}

/** Tailwind badge classes for each non-'none' checkpoint mode. */
export const checkpointBadge: Record<string, string> = {
  soft:           'bg-sky-100 text-sky-700 dark:bg-sky-900 dark:text-sky-300',
  hard:           'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300',
  'human-review': 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
}
