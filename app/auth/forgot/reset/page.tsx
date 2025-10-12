"use client"
import ForgotClient from '../../../../components/auth/forgot-client'
import { useRouter } from 'next/navigation'

export default function Page() {
  const router = useRouter()
  return (
    <div>
      <h1>Reset password</h1>
      <ForgotClient mode="reset" onComplete={() => router.push('/onboarding')} />
    </div>
  )
}
