import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { EmptyState } from '../empty-state.js'
import { useTestId } from '../../hooks/useTestId';

describe('EmptyState', () => {
  it('renders the title', () => {
    
  const { rootId, getTestId } = useTestId('anonymous', typeof dataTestId !== 'undefined' ? dataTestId : undefined);
render(<EmptyState data-testid={getTestId('empty-state')} title="No data" />)
    expect(screen.getByText('No data')).toBeInTheDocument()
  })

  it('renders description when provided', () => {
    
  const { rootId, getTestId } = useTestId('anonymous', typeof dataTestId !== 'undefined' ? dataTestId : undefined);
render(<EmptyState data-testid={getTestId('empty-state')} title="Empty" description="Nothing here yet." />)
    expect(screen.getByText('Nothing here yet.')).toBeInTheDocument()
  })

  it('does NOT render description when omitted', () => {
    
  const { rootId, getTestId } = useTestId('anonymous', typeof dataTestId !== 'undefined' ? dataTestId : undefined);
render(<EmptyState data-testid={getTestId('empty-state')} title="Empty" />)
    expect(screen.queryByText('Nothing here yet.')).not.toBeInTheDocument()
  })

  it('renders action content when provided', () => {
    
  const { rootId, getTestId } = useTestId('anonymous', typeof dataTestId !== 'undefined' ? dataTestId : undefined);
render(
      <EmptyState data-testid={getTestId('empty-state')}
        title="No runs"
        action={<button>Create run</button>}
      />,
    )
    expect(screen.getByRole('button', { name: 'Create run' })).toBeInTheDocument()
  })

  it('does NOT render action slot when omitted', () => {
    const { container } = render(<EmptyState title="Empty" />)
    expect(container.querySelector('button')).not.toBeInTheDocument()
  })

  it('renders SVG icon with aria-hidden', () => {
    const { container } = render(<EmptyState title="Empty" />)
    const svg = container.querySelector('svg')
    expect(svg).toHaveAttribute('aria-hidden', 'true')
  })

  it('forwards extra className to wrapper', () => {
    const { container } = render(
      <EmptyState title="Empty" className="mt-16" />,
    )
    expect(container.firstChild).toHaveClass('mt-16')
  })

  it('renders title + description + action together', () => {
    
  const { rootId, getTestId } = useTestId('anonymous', typeof dataTestId !== 'undefined' ? dataTestId : undefined);
render(
      <EmptyState data-testid={getTestId('empty-state')}
        title="No runs yet"
        description="Submit a run to get started."
        action={<a href="/submit">Submit</a>}
      />,
    )
    expect(screen.getByText('No runs yet')).toBeInTheDocument()
    expect(screen.getByText('Submit a run to get started.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Submit' })).toBeInTheDocument()
  })
})
