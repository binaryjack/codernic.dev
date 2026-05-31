'use client'

import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Heading, Text } from '../atoms/index.js'
import { cx } from '../lib/cx.js'

interface Props {
  children:  ReactNode
  /** Custom fallback UI — if omitted, a built-in recovery screen is shown */
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error:    Error | null
}

/**
 * React error boundaries must be implemented with a class component.
 * The class is kept internal; only the functional wrapper is exported.
 */
class ErrorBoundaryImpl extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  private reset = () => this.setState({ hasError: false, error: null })

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <div
          role="alert"
          className={cx('flex flex-col items-center justify-center gap-4 py-24 text-center px-6')}
        >
          <Heading level={2}>Something went wrong</Heading>
          <Text variant="muted" size="sm" className="max-w-sm">
            {this.state.error?.message ?? 'An unexpected error occurred.'}
          </Text>
          <button
            onClick={this.reset}
            className="mt-2 text-sm px-4 py-2 rounded-lg border border-(--border) text-(--text-muted) hover:bg-(--bg-alt) transition-colors"
          >
            Try again
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

export function ErrorBoundary(props: Props) {
  return <ErrorBoundaryImpl {...props} />
}
