import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from '../button'

describe('Button', () => {
  it('renders button with default props', () => {
    render(<Button>Click me</Button>)
    const button = screen.getByRole('button', { name: /click me/i })
    expect(button).toBeInTheDocument()
    expect(button).toHaveTextContent('Click me')
  })

  it('renders button with primary variant', () => {
    render(<Button variant="primary">Primary Button</Button>)
    const button = screen.getByRole('button', { name: /primary button/i })
    expect(button).toHaveClass('bg-zinc-900')
  })

  it('renders button with secondary variant', () => {
    render(<Button variant="secondary">Secondary Button</Button>)
    const button = screen.getByRole('button', { name: /secondary button/i })
    expect(button).toHaveClass('bg-white')
  })

  it('renders button with danger variant', () => {
    render(<Button variant="danger">Danger Button</Button>)
    const button = screen.getByRole('button', { name: /danger button/i })
    expect(button).toHaveClass('bg-red-600')
  })

  it('renders button with different sizes', () => {
    const { rerender } = render(<Button size="sm">Small</Button>)
    expect(screen.getByRole('button')).toHaveClass('text-xs')

    rerender(<Button size="md">Medium</Button>)
    expect(screen.getByRole('button')).toHaveClass('text-sm')

    rerender(<Button size="lg">Large</Button>)
    expect(screen.getByRole('button')).toHaveClass('text-base')
  })

  it('handles click events', async () => {
    const handleClick = jest.fn()
    const user = userEvent.setup()
    render(<Button onClick={handleClick}>Click me</Button>)
    
    const button = screen.getByRole('button', { name: /click me/i })
    await user.click(button)
    
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('disables button when disabled prop is true', () => {
    render(<Button disabled>Disabled Button</Button>)
    const button = screen.getByRole('button', { name: /disabled button/i })
    expect(button).toBeDisabled()
    expect(button).toHaveClass('opacity-50')
  })

  it('renders button with fullWidth', () => {
    render(<Button fullWidth>Full Width</Button>)
    const button = screen.getByRole('button', { name: /full width/i })
    expect(button).toHaveClass('w-full')
  })

  it('renders button with custom className', () => {
    render(<Button className="custom-class">Custom</Button>)
    const button = screen.getByRole('button', { name: /custom/i })
    expect(button).toHaveClass('custom-class')
  })

  it('renders as link when as="link"', () => {
    render(
      <Button as="link" href="/test">
        Link Button
      </Button>
    )
    const link = screen.getByRole('link', { name: /link button/i })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/test')
  })

  it('renders disabled link as span', () => {
    render(
      <Button as="link" href="/test" disabled>
        Disabled Link
      </Button>
    )
    const span = screen.getByText('Disabled Link')
    expect(span.tagName).toBe('SPAN')
    expect(span).toHaveClass('opacity-50')
  })

  it('renders as action button when as="action"', () => {
    render(<Button as="action">Action Button</Button>)
    const button = screen.getByRole('button', { name: /action button/i })
    expect(button).toBeInTheDocument()
    expect(button).toHaveClass('text-left')
  })
})

