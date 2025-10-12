"use client"
import React, { useState } from 'react'
import { apiClient } from '@/lib/api/client'


export default function ForgotClient({
  mode = 'enter',
  onComplete,
}: {
  mode?: 'enter' | 'reset'
  onComplete?: () => void
}) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [stage, setStage] = useState(mode)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSend = async (e: React.FormEvent) => {
  e.preventDefault()
  setError(null)
  try {
    const res = await apiClient.forgotPassword(email)
    if (res.success && res.data?.found) {
      setMessage(res.data.message || 'Email found — please create a new password')
      setStage('reset')
    } else {
      setError(res.data?.message || res.error || 'Email not found')
    }
  } catch (err: any) {
    setError(err?.message || 'Unexpected error')
  }
}

const handleReset = async (e: React.FormEvent) => {
  e.preventDefault()
  setError(null)
  try {
    const res = await apiClient.resetPassword(email, password)
    if (res.success && res.data?.success) {
      setMessage(res.data.message || 'Password reset successful')
      if (onComplete) onComplete()
    } else {
      setError(res.data?.message || res.error || 'Reset failed')
    }
  } catch (err: any) {
    setError(err?.message || 'Unexpected error')
  }
}


  if (stage === 'reset') {
    return (
      <form onSubmit={handleReset}>
        <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
        <input placeholder="New password" value={password} onChange={e => setPassword(e.target.value)} />
        <button data-testid="forgot-reset" type="submit">Reset</button>
        {message && <div>{message}</div>}
        {error && <div role="alert">{error}</div>}
      </form>
    )
  }

  return (
    <form onSubmit={handleSend}>
      <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
      <button data-testid="forgot-send" type="submit">Send reset email</button>
      {message && <div>{message}</div>}
      {error && <div role="alert">{error}</div>}
    </form>
  )
}
