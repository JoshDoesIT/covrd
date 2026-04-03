import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'
import { Modal } from './Modal'

test('renders null when isOpen is false', () => {
  render(
    <Modal isOpen={false} onClose={() => {}} title="Test">
      Content
    </Modal>,
  )
  expect(screen.queryByText('Test')).not.toBeInTheDocument()
})

test('renders content when isOpen is true', () => {
  render(
    <Modal isOpen={true} onClose={() => {}} title="Test Modal">
      <div>Modal Content</div>
    </Modal>,
  )
  expect(screen.getByText('Test Modal')).toBeInTheDocument()
  expect(screen.getByText('Modal Content')).toBeInTheDocument()
})

test('calls onClose when close button is clicked', async () => {
  const handleClose = vi.fn()
  const user = userEvent.setup()
  render(
    <Modal isOpen={true} onClose={handleClose} title="Test">
      Content
    </Modal>,
  )

  const closeButton = screen.getByRole('button', { name: /close/i })
  await user.click(closeButton)

  expect(handleClose).toHaveBeenCalledTimes(1)
})
