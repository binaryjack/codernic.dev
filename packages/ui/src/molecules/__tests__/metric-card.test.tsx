import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MetricCard } from '../metric-card.js'
import { useTestId } from '../../hooks/useTestId';

describe('MetricCard', () => {
  it('renders label text', () => {
    
  const { rootId, getTestId } = useTestId('anonymous', typeof dataTestId !== 'undefined' ? dataTestId : undefined);
render(<MetricCard data-testid={getTestId('metric-card')} label="Total cost" value="$1.23" />)
    expect(screen.getByText('Total cost')).toBeInTheDocument()
  })

  it('renders numeric value', () => {
    
  const { rootId, getTestId } = useTestId('anonymous', typeof dataTestId !== 'undefined' ? dataTestId : undefined);
render(<MetricCard data-testid={getTestId('metric-card')} label="Runs" value={42} />)
    expect(screen.getByText('42')).toBeInTheDocument()
  })

  it('renders string value', () => {
    
  const { rootId, getTestId } = useTestId('anonymous', typeof dataTestId !== 'undefined' ? dataTestId : undefined);
render(<MetricCard data-testid={getTestId('metric-card')} label="Duration" value="2m 30s" />)
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
    
  const { rootId, getTestId } = useTestId('anonymous', typeof dataTestId !== 'undefined' ? dataTestId : undefined);
render(<MetricCard data-testid={getTestId('metric-card')} label="Savings" value="$0.75" />)
    expect(screen.getByText('Savings')).toBeInTheDocument()
    expect(screen.getByText('$0.75')).toBeInTheDocument()
  })
})
