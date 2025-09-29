"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { GameButton } from "@/components/ui/game-button"
import { Alert } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { useAuthStore } from "@/lib/stores/auth-store"

export default function HostOnboardingPage() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  const validatePassword = (password: string): string | null => {
    if (!password) return "Password is required";
    if (password.trim() === "") return "Password cannot be Empty";
    if (password.length < 8) return "Password must be at least 8 characters";
    if (!/(?=.*[a-z])/.test(password)) return "Password must include at least one lowercase letter";
    if (!/(?=.*[A-Z])/.test(password)) return "Password must include at least one Uppercase letter";
    if (!/(?=.*[!@#$%^&*])/.test(password)) return "Password must be minimum of 8 characters and include at least one Uppercase, lowercase and a special character [!@#$%^&*]";
    return null;
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.fullName) newErrors.fullName = "Full name is required"
    if (!formData.email) newErrors.email = "Email is required"
    const passwordError = validatePassword(formData.password)
    if (passwordError) newErrors.password = passwordError
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "Passwords do not match"
    return newErrors
  }

  const { hostRegister, isLoading, error, clearError } = useAuthStore();
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setLoading(true);
    setErrors({});
    try {
      await hostRegister(formData.fullName.trim(), formData.email.trim(), formData.password);
      setSuccess(true);
      setTimeout(() => router.push("/dashboard"), 1500);
    } catch (err: any) {
      setErrors({ general: err.message || "Registration failed" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-3xl font-bold mb-6">Host Onboarding</h1>
      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4">
        <input
          type="text"
          placeholder="Full Name"
          value={formData.fullName}
          onChange={e => handleInputChange("fullName", e.target.value)}
          className="w-full p-2 border rounded"
        />
        {errors.fullName && <Alert variant="destructive"><AlertCircle />{errors.fullName}</Alert>}
        <input
          type="email"
          placeholder="Email"
          value={formData.email}
          onChange={e => handleInputChange("email", e.target.value)}
          className="w-full p-2 border rounded"
        />
        {errors.email && <Alert variant="destructive"><AlertCircle />{errors.email}</Alert>}
        <input
          type="password"
          placeholder="Password"
          value={formData.password}
          onChange={e => handleInputChange("password", e.target.value)}
          className="w-full p-2 border rounded"
        />
        {errors.password && <Alert variant="destructive"><AlertCircle />{errors.password}</Alert>}
        <input
          type="password"
          placeholder="Confirm Password"
          value={formData.confirmPassword}
          onChange={e => handleInputChange("confirmPassword", e.target.value)}
          className="w-full p-2 border rounded"
        />
        {errors.confirmPassword && <Alert variant="destructive"><AlertCircle />{errors.confirmPassword}</Alert>}
        {errors.general && <Alert variant="destructive"><AlertCircle />{errors.general}</Alert>}
        {error && <Alert variant="destructive"><AlertCircle />{error}<button className="ml-2 text-xs underline" onClick={clearError}>Dismiss</button></Alert>}
  {success && <Alert variant="default">Registration successful! Redirecting...</Alert>}
        <GameButton type="submit" disabled={loading || isLoading}>
          {loading || isLoading ? "Registering..." : "Register as Host"}
        </GameButton>
      </form>
    </div>
  )
}
