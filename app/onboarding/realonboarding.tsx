"use client"
import Image from "next/image"
import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { GameButton } from "@/components/ui/game-button"
import { useAuthStore } from "@/lib/stores/auth-store"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Info } from "lucide-react"

export default function OnboardingPage() {
  const [tab, setTab] = useState<"register" | "login">("register")
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showApiInfo, setShowApiInfo] = useState(false)

  const router = useRouter()
  const { login, register, isLoading, error, clearError } = useAuthStore()

  // Handle input changes
  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
    if (error) {
      clearError()
    }
  }

  // Validate form according to backend schema
  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (tab === "register") {
      // Full name validation: at least 3 characters, only alphabets and spaces
      if (!formData.fullName.trim()) {
        newErrors.fullName = "Full name is required"
      } else if (formData.fullName.trim().length < 3) {
        newErrors.fullName = "Full name must be at least 3 characters long"
      } else if (!/^[A-Za-z ]+$/.test(formData.fullName.trim())) {
        newErrors.fullName = "Full name must contain only alphabets and spaces"
      }

      // Confirm password validation
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = "Please confirm your password"
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match"
      }
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = "Email is required"
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address"
    }

    // Password validation: at least 8 characters, one uppercase, one lowercase, one number, one special character
    if (!formData.password) {
      newErrors.password = "Password is required"
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters long"
    } else if (!/^(?=.*\d)(?=.*[!@#$%^&*])(?=.*[a-z])(?=.*[A-Z]).{8,}$/.test(formData.password)) {
      newErrors.password =
        "Password must contain one uppercase, one lowercase, one number, and one special character (!@#$%^&*)"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    try {
      if (tab === "register") {
        await register(
          formData.fullName.trim(),
          formData.email.trim(),
          formData.password,
          formData.phone.trim() || undefined,
        )
      } else {
        await login(formData.email.trim(), formData.password)
      }

      // Wait a moment for the auth state to update, then redirect
      setTimeout(() => {
        router.push("/dashboard")
      }, 100)
    } catch (err) {
      // Error is handled by the store
      console.error("Auth error:", err)
    }
  }

  // Handle Google sign in (placeholder)
  const handleGoogleSignIn = () => {
    window.location.href = "https://mooves.onrender.com/api/v1/auth/google/login";
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

        {/* Tabs */}
        <div className="flex gap-8 mb-6 text-lg font-extrabold text-[#002B03] w-full justify-center">
          <button
            className={`pb-1 border-b-2 transition-all duration-150 ${tab === "register" ? "border-[#6AC56E]" : "border-transparent"}`}
            onClick={() => {
              setTab("register")
              setErrors({})
              clearError()
            }}
          >
            Register
          </button>
          <button
            className={`pb-1 border-b-2 transition-all duration-150 ${tab === "login" ? "border-[#6AC56E]" : "border-transparent"}`}
            onClick={() => {
              setTab("login")
              setErrors({})
              clearError()
            }}
          >
            Login
          </button>
        </div>

        {/* API Debug Info */}
        {error && error.includes("Endpoint might not exist") && (
          <Alert className="mb-4 w-full">
            <Info className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-semibold">API Endpoint Issue Detected</p>
                <p className="text-sm">The app is trying multiple endpoint patterns to find the correct backend API.</p>
                <button onClick={() => setShowApiInfo(!showApiInfo)} className="text-blue-600 hover:underline text-sm">
                  {showApiInfo ? "Hide" : "Show"} technical details
                </button>
                {showApiInfo && (
                  <div className="mt-2 p-2 bg-gray-100 rounded text-xs">
                    <p>
                      <strong>Base URL:</strong> https://mooves.onrender.com
                    </p>
                    <p>
                      <strong>Trying endpoints:</strong>
                    </p>
                    <ul className="list-disc list-inside ml-2">
                      <li>/auth/register</li>
                      <li>/api/auth/register</li>
                      <li>/api/v1/auth/register</li>
                      <li>/register</li>
                      <li>/signup</li>
                    </ul>
                  </div>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Error Alert */}
        {error && !error.includes("Endpoint might not exist") && (
          <Alert variant="destructive" className="mb-4 w-full">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Form */}
        <form className="flex flex-col gap-4 w-full" onSubmit={handleSubmit}>
          {tab === "register" && (
            <>
              <label className="text-[#002B03] font-bold">Full Name</label>
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
                  placeholder="Enter your full name (min 3 chars, letters only)"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange("fullName", e.target.value)}
                  className={`w-full pl-10 pr-3 py-2 rounded-lg bg-[#E6FFE6] border text-[#002B03] font-semibold focus:outline-none focus:ring-2 focus:ring-[#6AC56E] ${
                    errors.fullName ? "border-red-500" : "border-[#BFC4BF]"
                  }`}
                />
              </div>
              {errors.fullName && <p className="text-red-500 text-sm -mt-2">{errors.fullName}</p>}
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
              placeholder={
                tab === "register" ? "Min 8 chars, 1 upper, 1 lower, 1 number, 1 special" : "Enter your password"
              }
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

              <label className="text-[#002B03] font-bold">Phone (Optional)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6AC56E]">
                  <svg width="20" height="20" fill="none" viewBox="0 0 20 20">
                    <path
                      d="M2 3a1 1 0 0 1 1-1h2.153a1 1 0 0 1 .986.836l.74 4.435a1 1 0 0 1-.54 1.06l-1.548.773a11.037 11.037 0 0 0 6.105 6.105l.774-1.548a1 1 0 0 1 1.059-.54l4.435.74a1 1 0 0 1 .836.986V17a1 1 0 0 1-1 1h-2C7.82 18 2 12.18 2 5V3Z"
                      stroke="#6AC56E"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <input
                  type="tel"
                  placeholder="+234..."
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  className="w-full pl-10 pr-3 py-2 rounded-lg bg-[#E6FFE6] border border-[#BFC4BF] text-[#002B03] font-semibold focus:outline-none focus:ring-2 focus:ring-[#6AC56E]"
                />
              </div>
            </>
          )}

          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-white border border-[#BFC4BF] text-[#002B03] font-semibold mt-2 mb-2 shadow-sm hover:bg-[#f3fff3] transition"
          >
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
            Continue with Google
          </button>

          <GameButton type="submit" className="mt-2" disabled={isLoading}>
            {isLoading ? "Trying endpoints..." : tab === "register" ? "Register" : "Login"}
          </GameButton>
        </form>

        {/* Password requirements hint for registration */}
        {tab === "register" && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg w-full">
            <p className="text-xs text-blue-800 font-semibold mb-1">Password Requirements:</p>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• At least 8 characters long</li>
              <li>• One uppercase letter (A-Z)</li>
              <li>• One lowercase letter (a-z)</li>
              <li>• One number (0-9)</li>
              <li>• One special character (!@#$%^&*)</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
