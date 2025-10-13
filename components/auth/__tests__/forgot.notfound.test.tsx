import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ForgotClient from '../forgot-client'

// Mock the runtime apiClient used by ForgotClient to simulate not-found
jest.mock('@/lib/api/client', () => ({
  apiClient: {
    forgotPassword: jest.fn(async (email: string) => ({ success: true, data: { found: false, message: 'Email not found' } })),
    resetPassword: jest.fn(),
  }
}))

import { apiClient } from '@/lib/api/client'
import { act } from 'react'

test('email not found shows error and does not advance', async () => {
  const user = userEvent.setup()
  // apiClient mocked above will return found=false

  render(<ForgotClient mode="enter" />)
  const input = screen.getByPlaceholderText(/Email/i)
  const sendBtn = screen.getByTestId('forgot-send')

  await act(async () => {
    await user.type(input, 'missing@example.com')
    await user.click(sendBtn)
  })

  // alert should show
  const alert = await screen.findByRole('alert')
  expect(alert).toHaveTextContent(/Email not found/i)
  // reset button should NOT be present
  expect(screen.queryByTestId('forgot-reset')).toBeNull()
})
