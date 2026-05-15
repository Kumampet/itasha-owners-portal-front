import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ConfirmModal from '../confirm-modal'

describe('ConfirmModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    title: 'Test Title',
    message: 'Test Message',
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders modal when isOpen is true', () => {
    render(<ConfirmModal {...defaultProps} />)
    expect(screen.getByText('Test Title')).toBeInTheDocument()
    expect(screen.getByText('Test Message')).toBeInTheDocument()
  })

  it('does not render modal when isOpen is false', () => {
    render(<ConfirmModal {...defaultProps} isOpen={false} />)
    expect(screen.queryByText('Test Title')).not.toBeInTheDocument()
  })

  it('calls onClose when cancel button is clicked', async () => {
    const onClose = jest.fn()
    const user = userEvent.setup()
    render(<ConfirmModal {...defaultProps} onClose={onClose} />)

    const cancelButton = screen.getByRole('button', { name: /いいえ/i })
    await user.click(cancelButton)

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onConfirm when confirm button is clicked', async () => {
    const onConfirm = jest.fn()
    const onClose = jest.fn()
    const user = userEvent.setup()
    render(
      <ConfirmModal
        {...defaultProps}
        onClose={onClose}
        onConfirm={onConfirm}
      />
    )

    const confirmButton = screen.getByRole('button', { name: /はい/i })
    await user.click(confirmButton)

    expect(onConfirm).toHaveBeenCalledTimes(1)
    expect(onClose).not.toHaveBeenCalled()
  })

  it('calls onClose when confirm button is clicked without onConfirm', async () => {
    const onClose = jest.fn()
    const user = userEvent.setup()
    render(<ConfirmModal {...defaultProps} onClose={onClose} />)

    const confirmButton = screen.getByRole('button', { name: /ok/i })
    await user.click(confirmButton)

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('renders custom confirm and cancel labels', () => {
    const onConfirm = jest.fn()
    render(
      <ConfirmModal
        {...defaultProps}
        onConfirm={onConfirm}
        confirmLabel="確認"
        cancelLabel="キャンセル"
      />
    )
    expect(screen.getByRole('button', { name: /確認/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /キャンセル/i })).toBeInTheDocument()
  })

  it('hides cancel button when showCancel is false', () => {
    render(<ConfirmModal {...defaultProps} showCancel={false} />)
    expect(screen.queryByRole('button', { name: /いいえ/i })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /ok/i })).toBeInTheDocument()
  })

  it('renders message with multiple lines', () => {
    const multiLineMessage = 'Line 1\nLine 2\nLine 3'
    render(<ConfirmModal {...defaultProps} message={multiLineMessage} />)
    expect(screen.getByText('Line 1')).toBeInTheDocument()
    expect(screen.getByText('Line 2')).toBeInTheDocument()
    expect(screen.getByText('Line 3')).toBeInTheDocument()
  })

  it('applies correct variant colors', () => {
    const { rerender } = render(
      <ConfirmModal {...defaultProps} messageVariant="success" />
    )
    expect(screen.getByText('Test Message')).toHaveClass('text-green-600')

    rerender(<ConfirmModal {...defaultProps} messageVariant="error" />)
    expect(screen.getByText('Test Message')).toHaveClass('text-red-600')

    rerender(<ConfirmModal {...defaultProps} messageVariant="info" />)
    expect(screen.getByText('Test Message')).toHaveClass('text-zinc-600')
  })
})

