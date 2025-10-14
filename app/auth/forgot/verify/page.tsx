"use client"
import ForgotClient from "@/components/auth/forgot-client"
import { useRouter } from "next/navigation"

export default function Page() {
  const router = useRouter()
  return <ForgotClient mode="verify" onComplete={() => router.push("/onboarding")} />
}
