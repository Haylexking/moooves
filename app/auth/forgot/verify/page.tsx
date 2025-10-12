"use client"
import ForgotClient from '../../../../components/auth/forgot-client'
import { useRouter } from 'next/navigation'

export default function Page() {
  const router = useRouter()
  // verify mode isn't used in the email-only flow; render enter instead
  return (
    <div>
      <h1>Forgot password</h1>
      <ForgotClient mode="enter" onComplete={() => router.push('/onboarding')} />
    </div>
  )
}
