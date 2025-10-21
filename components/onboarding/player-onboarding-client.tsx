"use client"
import Image from "next/image"
import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { GameButton } from "@/components/ui/game-button"
import PasswordInput from "@/components/ui/password-input"
import { useAuthStore } from "@/lib/stores/auth-store"
import { Alert } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { apiClient } from "@/lib/api/client"
import { getReturnPath, clearReturnPath } from "@/lib/utils/navigation"

export default function PlayerOnboardingClient() {
  const [tab, setTab] = useState<"register" | "login">("register")
  const [formData, setFormData] = useState({ username: "", email: "", password: "", confirmPassword: "" })
  const [loginData, setLoginData] = useState({ email: "", password: "" })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loginError, setLoginError] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const { login, register, isLoading, error, clearError } = useAuthStore()

  // Persist onboarding mode for auth redirects
  useEffect(() => {
    try { localStorage.setItem('onboarding_mode', 'player') } catch {}
  }, [])

  const validatePassword = (password: string): string | null => {
    if (!password) return "Password is required"
    if (password.trim() === "") return "Password cannot be Empty"
    if (password.length < 8) return "Password must be at least 8 characters"
    if (!/(?=.*[a-z])/.test(password)) return "Password must include at least one lowercase letter"
    if (!/(?=.*[A-Z])/.test(password)) return "Password must include at least one Uppercase letter"
    if (!/(?=.*[!@#$%^&*])/.test(password))
      return "Password must be minimum of 8 characters and include at least one Uppercase, lowercase and a special character [!@#$%^&*]"
    return null
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }))
  }
  const handleLoginInputChange = (field: string, value: string) => {
    setLoginData((prev) => ({ ...prev, [field]: value }))
    if (loginError) setLoginError("")
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    if (tab === "register") {
      if (!formData.username.trim()) newErrors.username = "Username is required"
      else if (formData.username.trim().length < 3) newErrors.username = "Username must be at least 3 characters long"
      else if (!/^[A-Za-z ]+$/.test(formData.username.trim())) newErrors.username = "Username must contain only letters and spaces"
      if (!formData.confirmPassword) newErrors.confirmPassword = "Please confirm your password"
      else if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "Passwords do not match"
    }
    if (!formData.email.trim()) newErrors.email = "Email is required"
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) newErrors.email = "Please enter a valid email address"
    const passwordError = validatePassword(formData.password)
    if (passwordError) newErrors.password = passwordError
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const waitForAuthInit = async (timeout = 7000) => {
    const start = Date.now()
    const storeApi: any = useAuthStore as any
    if (!storeApi || typeof storeApi.getState !== "function" || typeof storeApi.subscribe !== "function") {
      return Promise.resolve(storeApi && typeof storeApi.getState === "function" ? storeApi.getState() : {})
    }
    const current = storeApi.getState() || {}
    if (current.isAuthenticated || current.user) return Promise.resolve(current)
    return new Promise((resolve) => {
      const unsub = storeApi.subscribe((state: any) => {
        if (state.isAuthenticated || state.user) {
          try {
            const { logDebug } = require("@/lib/hooks/use-debug-logger")
            logDebug("Onboarding", { event: "auth-initialized", state })
          } catch {}
          unsub()
          resolve(state)
        }
        if (Date.now() - start > timeout) {
          unsub()
          resolve(storeApi.getState())
        }
      })
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return
    setLoading(true)
    try {
      await register(formData.username.trim(), formData.email.trim(), formData.password)
      const storeFn: any = useAuthStore as any
      const authAfter = storeFn?.getState ? storeFn.getState() : {}
      if (authAfter.isAuthenticated) {
        try {
          const { logDebug } = require("@/lib/hooks/use-debug-logger")
          const token = apiClient?.getToken?.() || null
          logDebug("Onboarding", { event: "register-complete", tokenPresent: !!token })
        } catch {}
        await waitForAuthInit(7000)
        const ret = typeof window !== "undefined" ? getReturnPath() : null
        if (ret) {
          clearReturnPath()
          router.push(ret)
        } else {
          router.push("/dashboard")
        }
        return
      }
      if (authAfter.error) {
        const msg: string = authAfter.error
        if (/email/i.test(msg)) setErrors((prev) => ({ ...prev, email: msg }))
        else if (/user(name)?/i.test(msg) || /username/i.test(msg)) setErrors((prev) => ({ ...prev, username: msg }))
      }
    } catch {} finally {
      setLoading(false)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError("")
    setLoading(true)
    try {
      await login(loginData.email.trim(), loginData.password)
      const storeFn: any = useAuthStore as any
      const authAfterLogin = storeFn?.getState ? storeFn.getState() : {}
      if (authAfterLogin.isAuthenticated) {
        try {
          const { logDebug } = require("@/lib/hooks/use-debug-logger")
          const token = apiClient?.getToken?.() || null
          logDebug("Onboarding", { event: "login-complete", tokenPresent: !!token })
        } catch {}
        await waitForAuthInit(7000)
        const ret = typeof window !== "undefined" ? getReturnPath() : null
        if (ret) {
          clearReturnPath()
          router.push(ret)
        } else {
          router.push("/dashboard")
        }
        return
      }
      if (authAfterLogin.error) setLoginError(authAfterLogin.error)
    } catch (err: any) {
      if (err?.message && err.message.toLowerCase().includes("not found")) setLoginError("Credentials not found. Would you like to register instead?")
      else setLoginError(err?.message || "Login failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-black overflow-hidden">
      <Image src="/images/background.png" alt="Background" fill className="object-cover object-center z-0 opacity-90" priority />
      <div className="relative z-10 w-full max-w-md mx-auto mt-12 rounded-[24px] bg-[#E6FFE6]/90 border-4 border-[#6AC56E] shadow-2xl flex flex-col items-center px-6 py-8">
        <div className="-mt-16 mb-2 flex justify-center w-full">
          <Image src="/images/XO.png" alt="XO Logo" width={120} height={60} className="drop-shadow-xl" />
        </div>
        {error && (
          <div className="mb-4 w-full">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
              <button className="ml-2 text-xs underline" onClick={clearError}>Dismiss</button>
            </Alert>
          </div>
        )}
        <div className="flex gap-8 mb-6 text-lg font-extrabold text-[#002B03] w-full justify-center">
          <button className={`pb-1 border-b-2 transition-all duration-150 ${tab === "register" ? "border-[#6AC56E]" : "border-transparent"}`} onClick={() => { setTab("register"); setErrors({}) }}>Register</button>
          <button className={`pb-1 border-b-2 transition-all duration-150 ${tab === "login" ? "border-[#6AC56E]" : "border-transparent"}`} onClick={() => { setTab("login"); setErrors({}) }}>Login</button>
        </div>
        {tab === "register" && (
          <form className="flex flex-col gap-4 w-full" onSubmit={handleSubmit}>
            <label className="text-[#002B03] font-bold">Username</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6AC56E]">
                <svg width="20" height="20" fill="none" viewBox="0 0 20 20"><path d="M10 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM6 10.5a4 4 0 0 0-4 4 2 2 0 0 0 2 2h12a2 2 0 0 0 2-2 4 4 0 0 0-4-4H6Z" stroke="#6AC56E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </span>
              <input type="text" placeholder="Enter your username" value={formData.username} onChange={(e) => handleInputChange("username", e.target.value)} className={`w-full pl-10 pr-3 py-2 rounded-lg bg-[#E6FFE6] border text-[#002B03] font-semibold focus:outline-none focus:ring-2 focus:ring-[#6AC56E] ${errors.username ? "border-red-500" : "border-[#BFC4BF]"}`} />
            </div>
            {errors.username && <p className="text-red-500 text-sm -mt-2">{errors.username}</p>}
            <label className="text-[#002B03] font-bold">Email</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6AC56E]">
                <svg width="20" height="20" fill="none" viewBox="0 0 20 20"><path d="M2.5 5.833A2.5 2.5 0 0 1 5 3.333h10a2.5 2.5 0 0 1 2.5 2.5v8.334a2.5 2.5 0 0 1-2.5 2.5H5a2.5 2.5 0 0 1-2.5-2.5V5.833Zm0 0L10 11.25l7.5-5.417" stroke="#6AC56E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </span>
              <input type="email" placeholder="Enter your email" value={formData.email} onChange={(e) => handleInputChange("email", e.target.value)} className={`w-full pl-10 pr-3 py-2 rounded-lg bg-[#E6FFE6] border text-[#002B03] font-semibold focus:outline-none focus:ring-2 focus:ring-[#6AC56E] ${errors.email ? "border-red-500" : "border-[#BFC4BF]"}`} />
            </div>
            {errors.email && <p className="text-red-500 text-sm -mt-2">{errors.email}</p>}
            <label className="text-[#002B03] font-bold">Password</label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-[#6AC56E] z-10"><svg width="20" height="20" fill="none" viewBox="0 0 20 20"><rect x="4" y="8" width="12" height="8" rx="2" stroke="#6AC56E" strokeWidth="1.5" /><path d="M10 12v2" stroke="#6AC56E" strokeWidth="1.5" strokeLinecap="round" /></svg></span>
              <PasswordInput placeholder="Enter your password" value={formData.password} onChange={(e) => handleInputChange("password", e.target.value)} showStrength className={`${errors.password ? "border-red-500" : "border-[#BFC4BF]"} pl-10`} />
            </div>
            {errors.password && <p className="text-red-500 text-sm -mt-2">{errors.password}</p>}
            <div className="text-xs text-[#002B03]/70 -mt-2">Password must be at least 8 characters with uppercase, lowercase, number, and special character (!@#$%^&*)</div>
            <label className="text-[#002B03] font-bold">Confirm Password</label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-[#6AC56E] z-10"><svg width="20" height="20" fill="none" viewBox="0 0 20 20"><rect x="4" y="8" width="12" height="8" rx="2" stroke="#6AC56E" strokeWidth="1.5" /><path d="M10 12v2" stroke="#6AC56E" strokeWidth="1.5" strokeLinecap="round" /></svg></span>
              <PasswordInput placeholder="Confirm your password" value={formData.confirmPassword} onChange={(e) => handleInputChange("confirmPassword", e.target.value)} className={`${errors.confirmPassword ? "border-red-500" : "border-[#BFC4BF]"} pl-10`} />
            </div>
            {errors.confirmPassword && <p className="text-red-500 text-sm -mt-2">{errors.confirmPassword}</p>}
            <GameButton data-testid="onboarding-register-submit" type="submit" className="mt-2" disabled={loading}>{loading ? "Loading..." : "Register as Player"}</GameButton>
          </form>
        )}
        {tab === "login" && (
          <form className="flex flex-col gap-4 w-full" onSubmit={handleLogin}>
            <label className="text-[#002B03] font-bold">Email</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6AC56E]"><svg width="20" height="20" fill="none" viewBox="0 0 20 20"><path d="M2.5 5.833A2.5 2.5 0 0 1 5 3.333h10a2.5 2.5 0 0 1 2.5 2.5v8.334a2.5 2.5 0 0 1-2.5 2.5H5a2.5 2.5 0 0 1-2.5-2.5V5.833Zm0 0L10 11.25l7.5-5.417" stroke="#6AC56E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg></span>
              <input type="email" placeholder="Enter your email" value={loginData.email} onChange={(e) => handleLoginInputChange("email", e.target.value)} className="w-full pl-10 pr-3 py-2 rounded-lg bg-[#E6FFE6] border text-[#002B03] font-semibold focus:outline-none focus:ring-2 focus:ring-[#6AC56E]" />
            </div>
            <label className="text-[#002B03] font-bold">Password</label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-[#6AC56E] z-10"><svg width="20" height="20" fill="none" viewBox="0 0 20 20"><rect x="4" y="8" width="12" height="8" rx="2" stroke="#6AC56E" strokeWidth="1.5" /><path d="M10 12v2" stroke="#6AC56E" strokeWidth="1.5" strokeLinecap="round" /></svg></span>
              <PasswordInput placeholder="Enter your password" value={loginData.password} onChange={(e) => handleLoginInputChange("password", e.target.value)} className="pl-10" />
            </div>
            <div className="flex justify-end -mt-2">
              <button type="button" onClick={() => router.push("/auth/forgot/enter-email")} className="text-sm text-[#6AC56E] hover:text-[#5AB55E] font-semibold underline">Forgot password?</button>
            </div>
            {loginError && (
              <div className="text-red-500 text-sm -mt-2">{loginError} <button type="button" className="underline ml-2" onClick={() => setTab("register")}>Register</button></div>
            )}
            <GameButton data-testid="onboarding-login-submit" type="submit" className="mt-2" disabled={loading}>{loading ? "Logging in..." : "Login"}</GameButton>
          </form>
        )}
      </div>
    </div>
  )
}
