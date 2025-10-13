import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { act } from 'react'
import ForgotClient from '../forgot-client'

// Mock the apiClient used by ForgotClient to avoid relying on global.fetch
jest.mock('@/lib/api/client', () => ({
  apiClient: {
    forgotPassword: jest.fn(async (email: string) => ({ success: true, data: { found: true, message: 'ok' } })),
    resetPassword: jest.fn(async (email: string, password: string) => ({ success: true, data: { success: true, message: 'Password reset' } })),
  }
}))

test('full forgot -> reset flow', async () => {
  const user = userEvent.setup()
  const onComplete = jest.fn()
  render(<ForgotClient mode="enter" onComplete={onComplete} />)

  const emailInput = screen.getByPlaceholderText(/Email/i)
  const sendBtn = screen.getByTestId('forgot-send')

  await act(async () => {
    await user.type(emailInput, 'test@example.com')
    await user.click(sendBtn)
  })

  // now the component should show the reset form
  await screen.findByTestId('forgot-reset')

  const pwdInput = screen.getByPlaceholderText(/New password/i)
  const resetBtn = screen.getByTestId('forgot-reset')

  await act(async () => {
    await user.type(pwdInput, 'NewP@ssw0rd')
    await user.click(resetBtn)
  })

  // success message should appear and onComplete should have been called
  await screen.findByText(/Password reset successful|Password reset/i)
  expect(onComplete).toHaveBeenCalled()
})
