'use client'

import { useState } from 'react'
import { cx } from '../lib/cx.js'
import { Button } from './button.js'
import { useTestId } from '../hooks/useTestId';

interface CodeBlockProps {
  code:       string
  language?:  string
  copyable?:  boolean
  className?: string
  maxHeight?: string
  dataTestId?: string;
}

export function CodeBlock({ dataTestId,
  code,
  language  = '',
  copyable  = true,
  className = '',
  maxHeight = '24rem',
}: CodeBlockProps) {
  
  const { rootId, getTestId } = useTestId('code-block', dataTestId);
const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  return (
    <div
      className={cx(
        'relative rounded-node border border-neutral-200 dark:border-neutral-700',
        'bg-neutral-900',
        className,
      )}
      data-testid={rootId}
    >
      {(language || copyable) && (
        <div className="flex items-center justify-between px-3 py-1 border-b border-neutral-700">
          {language && (
            <span className="text-xs text-neutral-400 font-mono">{language}</span>
          )}
          {copyable && (
            <Button data-testid={getTestId('button')}
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="text-neutral-400 hover:text-neutral-100"
            >
              {copied ? '✓ Copied' : 'Copy'}
            </Button>
          )}
        </div>
      )}
      <pre
        style={{ maxHeight, overflowY: 'auto' }}
        className="p-4 text-sm font-mono text-neutral-100 whitespace-pre overflow-x-auto"
      >
        <code>{code}</code>
      </pre>
    </div>
  )
}
