import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ForgotClient from '../forgot-client'

// mock the callApi used by ForgotClient
jest.mock('../../../lib/test-utils/apiTestClient', () => ({
  callApi: jest.fn(),
}))

import { callApi } from '../../../lib/test-utils/apiTestClient'
import { act } from 'react'

test('email not found shows error and does not advance', async () => {
  const user = userEvent.setup()
  // mock the callApi to return found: false for the forgot endpoint
  ;(callApi as jest.Mock).mockImplementation(({ path }) => {
    if (path === '/api/v1/auth/forgot') {
      return Promise.resolve({ json: async () => ({ found: false, message: 'Email not found' }) })
    }
    return Promise.resolve({ json: async () => ({}) })
  })

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
