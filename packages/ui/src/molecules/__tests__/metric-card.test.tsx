import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MetricCard } from '../metric-card.js'

describe('MetricCard', () => {
  it('renders label text', () => {
    render(<MetricCard label="Total cost" value="$1.23" />)
    expect(screen.getByText('Total cost')).toBeInTheDocument()
  })

  it('renders numeric value', () => {
    render(<MetricCard label="Runs" value={42} />)
    expect(screen.getByText('42')).toBeInTheDocument()
  })

  it('renders string value', () => {
    render(<MetricCard label="Duration" value="2m 30s" />)
    expect(screen.getByText('2m 30s')).toBeInTheDocument()
  })

  describe('size prop', () => {
    it('size="lg" applies text-2xl to value', () => {
      const { container } = render(<MetricCard label="Cost" value="$1.00" size="lg" />)
      // MetricCard renders <Text> for label (p[0]) + <p> for value (p[1])
      const ps = container.querySelectorAll('p')
      const valueParagraph = ps[ps.length - 1]
      expect(valueParagraph?.className).toContain('text-2xl')
    })

    it('size="sm" (default) applies text-xl to value', () => {
      const { container } = render(<MetricCard label="Cost" value="$1.00" />)   
      const ps = container.querySelectorAll('p')
      const valueParagraph = ps[ps.length - 1]
      expect(valueParagraph?.className).toContain('text-xl')
    })
  })

  it('passes extra className to wrapper', () => {
    const { container } = render(
      <MetricCard label="X" value="Y" className="custom-class" />,
    )
    expect(container.firstChild).toHaveClass('custom-class')
  })

  it('renders both label and value together', () => {
    render(<MetricCard label="Savings" value="$0.75" />)
    expect(screen.getByText('Savings')).toBeInTheDocument()
    expect(screen.getByText('$0.75')).toBeInTheDocument()
  })
})
