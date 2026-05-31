import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Skeleton } from '../../atoms/skeleton.js'
import { SkeletonCard } from '../skeleton-card.js'
import { SkeletonRows } from '../skeleton-rows.js'

describe('Skeleton', () => {
  it('renders without crashing', () => {
    const { container } = render(<Skeleton />)
    expect(container.firstChild).toBeInTheDocument()
  })

  it('has aria-hidden="true"', () => {
    const { container } = render(<Skeleton />)
    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true')
  })

  it('forwards className', () => {
    const { container } = render(<Skeleton className="h-4 w-32" />)
    expect(container.firstChild).toHaveClass('h-4', 'w-32')
  })

  it('applies animate-pulse', () => {
    const { container } = render(<Skeleton />)
    expect(container.firstChild).toHaveClass('animate-pulse')
  })
})

describe('SkeletonCard', () => {
  it('renders two Skeleton children', () => {
    const { container } = render(<SkeletonCard />)
    const pulses = container.querySelectorAll('.animate-pulse')
    expect(pulses.length).toBeGreaterThanOrEqual(2)
  })

  it('has aria-hidden="true" on wrapper', () => {
    const { container } = render(<SkeletonCard />)
    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true')
  })

  it('size="lg" uses larger value skeleton width', () => {
    const { container } = render(<SkeletonCard size="lg" />)
    const inner = container.querySelectorAll('.animate-pulse')
    expect(inner[1]).toHaveClass('h-8')
  })

  it('size="sm" (default) uses smaller value skeleton width', () => {
    const { container } = render(<SkeletonCard />)
    const inner = container.querySelectorAll('.animate-pulse')
    expect(inner[1]).toHaveClass('h-5')
  })
})

describe('SkeletonRows', () => {
  it('renders the correct number of <tr> elements', () => {
    const { container } = render(
      <table><tbody><SkeletonRows rows={4} cols={3} /></tbody></table>,
    )
    expect(container.querySelectorAll('tr')).toHaveLength(4)
  })

  it('renders the correct number of <td> per row', () => {
    const { container } = render(
      <table><tbody><SkeletonRows rows={2} cols={6} /></tbody></table>,
    )
    const rows = container.querySelectorAll('tr')
    rows.forEach(row => {
      expect(row.querySelectorAll('td')).toHaveLength(6)
    })
  })

  it('defaults to 5 rows and 5 cols', () => {
    const { container } = render(
      <table><tbody><SkeletonRows /></tbody></table>,
    )
    expect(container.querySelectorAll('tr')).toHaveLength(5)
    expect(container.querySelector('tr')?.querySelectorAll('td')).toHaveLength(5)
  })

  it('all rows have aria-hidden="true"', () => {
    const { container } = render(
      <table><tbody><SkeletonRows rows={3} cols={2} /></tbody></table>,
    )
    container.querySelectorAll('tr').forEach(tr => {
      expect(tr).toHaveAttribute('aria-hidden', 'true')
    })
  })
})
