"use client"
import Image from "next/image"
import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { GameButton } from "@/components/ui/game-button"
import { useAuthStore } from "@/lib/stores/auth-store"
import { Alert } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { apiClient } from "@/lib/api/client"

export default function OnboardingPage() {
  const [tab, setTab] = useState<"register" | "login">("register")
  const [userType, setUserType] = useState<"user" | "host">("user")
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  const router = useRouter()

  // Handle input changes
  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  // Basic validation for UI feedback
  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (tab === "register") {
      if (!formData.username.trim()) {
        newErrors.username = "Username is required"
      }
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = "Please confirm your password"
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match"
      }
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required"
    }

    if (!formData.password) {
      newErrors.password = "Password is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const { login, register, hostLogin, hostRegister, isLoading, error, clearError } = useAuthStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return
    setLoading(true)
    try {
      if (tab === "register") {
        if (userType === "host") {
          await hostRegister(formData.username.trim(), formData.email.trim(), formData.password)
        } else {
          await register(formData.username.trim(), formData.email.trim(), formData.password)
        }
        router.push("/dashboard")
      } else {
        if (userType === "host") {
          await hostLogin(formData.email.trim(), formData.password)
        } else {
          await login(formData.email.trim(), formData.password)
        }
        // After login, go to dashboard
        router.push("/dashboard")
      }
    } catch (err) {
      // Error is handled by the store
      // Optionally show a toast or alert
    } finally {
      setLoading(false)
    }
  }

  // Handle Google sign in (real)
  const handleGoogleSignIn = () => {
    if (userType === "host") {
      window.location.href = apiClient.getHostGoogleAuthUrl()
    } else {
      window.location.href = apiClient.getGoogleAuthUrl()
    }
  }

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-black overflow-hidden">
      {/* Background image */}
      <Image
        src="/images/background.png"
        alt="Background"
        fill
        className="object-cover object-center z-0 opacity-90"
        priority
      />

      {/* Centered onboarding card */}
      <div className="relative z-10 w-full max-w-md mx-auto mt-12 rounded-[24px] bg-[#E6FFE6]/90 border-4 border-[#6AC56E] shadow-2xl flex flex-col items-center px-6 py-8">
        {/* XO logo */}
        <div className="-mt-16 mb-2 flex justify-center w-full">
          <Image src="/images/XO.png" alt="XO Logo" width={120} height={60} className="drop-shadow-xl" />
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 w-full">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
              <button className="ml-2 text-xs underline" onClick={clearError}>
                Dismiss
              </button>
            </Alert>
          </div>
        )}

        <div className="flex gap-4 mb-4 text-sm font-bold text-[#002B03] w-full justify-center">
          <button
            className={`px-3 py-1 rounded-full transition-all duration-150 ${
              userType === "user" ? "bg-[#6AC56E] text-white" : "bg-transparent border border-[#6AC56E]"
            }`}
            onClick={() => setUserType("user")}
          >
            Player
          </button>
          <button
            className={`px-3 py-1 rounded-full transition-all duration-150 ${
              userType === "host" ? "bg-[#6AC56E] text-white" : "bg-transparent border border-[#6AC56E]"
            }`}
            onClick={() => setUserType("host")}
          >
            Host
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-8 mb-6 text-lg font-extrabold text-[#002B03] w-full justify-center">
          <button
            className={`pb-1 border-b-2 transition-all duration-150 ${tab === "register" ? "border-[#6AC56E]" : "border-transparent"}`}
            onClick={() => {
              setTab("register")
              setErrors({})
            }}
          >
            Register
          </button>
          <button
            className={`pb-1 border-b-2 transition-all duration-150 ${tab === "login" ? "border-[#6AC56E]" : "border-transparent"}`}
            onClick={() => {
              setTab("login")
              setErrors({})
            }}
          >
            Login
          </button>
        </div>

        {/* Form */}
        <form className="flex flex-col gap-4 w-full" onSubmit={handleSubmit}>
          {tab === "register" && (
            <>
              <label className="text-[#002B03] font-bold">Username</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6AC56E]">
                  <svg width="20" height="20" fill="none" viewBox="0 0 20 20">
                    <path
                      d="M10 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM6 10.5a4 4 0 0 0-4 4 2 2 0 0 0 2 2h12a2 2 0 0 0 2-2 4 4 0 0 0-4-4H6Z"
                      stroke="#6AC56E"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <input
                  type="text"
                  placeholder="Enter your username"
                  value={formData.username}
                  onChange={(e) => handleInputChange("username", e.target.value)}
                  className={`w-full pl-10 pr-3 py-2 rounded-lg bg-[#E6FFE6] border text-[#002B03] font-semibold focus:outline-none focus:ring-2 focus:ring-[#6AC56E] ${
                    errors.username ? "border-red-500" : "border-[#BFC4BF]"
                  }`}
                />
              </div>
              {errors.username && <p className="text-red-500 text-sm -mt-2">{errors.username}</p>}
            </>
          )}

          <label className="text-[#002B03] font-bold">Email</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6AC56E]">
              <svg width="20" height="20" fill="none" viewBox="0 0 20 20">
                <path
                  d="M2.5 5.833A2.5 2.5 0 0 1 5 3.333h10a2.5 2.5 0 0 1 2.5 2.5v8.334a2.5 2.5 0 0 1-2.5 2.5H5a2.5 2.5 0 0 1-2.5-2.5V5.833Zm0 0L10 11.25l7.5-5.417"
                  stroke="#6AC56E"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <input
              type="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              className={`w-full pl-10 pr-3 py-2 rounded-lg bg-[#E6FFE6] border text-[#002B03] font-semibold focus:outline-none focus:ring-2 focus:ring-[#6AC56E] ${
                errors.email ? "border-red-500" : "border-[#BFC4BF]"
              }`}
            />
          </div>
          {errors.email && <p className="text-red-500 text-sm -mt-2">{errors.email}</p>}

          <label className="text-[#002B03] font-bold">Password</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6AC56E]">
              <svg width="20" height="20" fill="none" viewBox="0 0 20 20">
                <rect x="4" y="8" width="12" height="8" rx="2" stroke="#6AC56E" strokeWidth="1.5" />
                <path d="M10 12v2" stroke="#6AC56E" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </span>
            <input
              type="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={(e) => handleInputChange("password", e.target.value)}
              className={`w-full pl-10 pr-3 py-2 rounded-lg bg-[#E6FFE6] border text-[#002B03] font-semibold focus:outline-none focus:ring-2 focus:ring-[#6AC56E] ${
                errors.password ? "border-red-500" : "border-[#BFC4BF]"
              }`}
            />
          </div>
          {errors.password && <p className="text-red-500 text-sm -mt-2">{errors.password}</p>}

          {tab === "register" && (
            <>
              <label className="text-[#002B03] font-bold">Confirm Password</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6AC56E]">
                  <svg width="20" height="20" fill="none" viewBox="0 0 20 20">
                    <rect x="4" y="8" width="12" height="8" rx="2" stroke="#6AC56E" strokeWidth="1.5" />
                    <path d="M10 12v2" stroke="#6AC56E" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </span>
                <input
                  type="password"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                  className={`w-full pl-10 pr-3 py-2 rounded-lg bg-[#E6FFE6] border text-[#002B03] font-semibold focus:outline-none focus:ring-2 focus:ring-[#6AC56E] ${
                    errors.confirmPassword ? "border-red-500" : "border-[#BFC4BF]"
                  }`}
                />
              </div>
              {errors.confirmPassword && <p className="text-red-500 text-sm -mt-2">{errors.confirmPassword}</p>}
            </>
          )}

          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-white border border-[#BFC4BF] text-[#002B03] font-semibold mt-2 mb-2 shadow-sm hover:bg-[#f3fff3] transition"
          >
            <img
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/design-mode-images/google-color-SXMzEgXIYrSGdaJTIzfnwjMHvCpp8z.svg"
              alt="Google"
              className="w-5 h-5"
            />
            Continue with Google
          </button>

          <GameButton type="submit" className="mt-2" disabled={loading}>
            {loading
              ? "Loading..."
              : tab === "register"
                ? `Register as ${userType === "host" ? "Host" : "Player"}`
                : "Login"}
          </GameButton>
        </form>
      </div>
    </div>
  )
}
