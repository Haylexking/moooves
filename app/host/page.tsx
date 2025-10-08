"use client"


import Image from "next/image"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { GameButton } from "@/components/ui/game-button"
import { Alert } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { useAuthStore } from "@/lib/stores/auth-store"

export default function HostOnboardingPage() {
  const [tab, setTab] = useState<"register" | "login">("register");
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loginError, setLoginError] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const { hostRegister, hostLogin, isLoading, error, clearError } = useAuthStore();

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };
  const handleLoginInputChange = (field: string, value: string) => {
    setLoginData((prev) => ({ ...prev, [field]: value }));
    if (loginError) setLoginError("");
  };

  const validatePassword = (password: string): string | null => {
    if (!password) return "Password is required";
    if (password.trim() === "") return "Password cannot be Empty";
    if (password.length < 8) return "Password must be at least 8 characters";
    if (!/(?=.*[a-z])/.test(password)) return "Password must include at least one lowercase letter";
    if (!/(?=.*[A-Z])/.test(password)) return "Password must include at least one Uppercase letter";
    if (!/(?=.*[!@#$%^&*])/.test(password)) return "Password must be minimum of 8 characters and include at least one Uppercase, lowercase and a special character [!@#$%^&*]";
    return null;
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.fullName) newErrors.fullName = "Full name is required";
    if (!formData.email) newErrors.email = "Email is required";
    const passwordError = validatePassword(formData.password);
    if (passwordError) newErrors.password = passwordError;
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "Passwords do not match";
    return newErrors;
  };

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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoading(true);
    try {
      await hostLogin(loginData.email.trim(), loginData.password);
      // Only redirect if isAuthenticated and user is host
      const { isAuthenticated, user } = useAuthStore.getState();
      if (isAuthenticated && user?.role === "host") {
        router.push("/dashboard");
      } else {
        setLoginError("Host not found or invalid credentials. Please register as a host.");
      }
    } catch (err: any) {
      setLoginError(err?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

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
        {errors.general && (
          <div className="mb-4 w-full">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <span>{errors.general}</span>
            </Alert>
          </div>
        )}
        {success && (
          <div className="mb-4 w-full">
            <Alert variant="default">Registration successful! Redirecting...</Alert>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-8 mb-6 text-lg font-extrabold text-[#002B03] w-full justify-center">
          <button
            className={`pb-1 border-b-2 transition-all duration-150 ${tab === "register" ? "border-[#6AC56E]" : "border-transparent"}`}
            onClick={() => {
              setTab("register");
              setErrors({});
              setLoginError("");
            }}
          >
            Register
          </button>
          <button
            className={`pb-1 border-b-2 transition-all duration-150 ${tab === "login" ? "border-[#6AC56E]" : "border-transparent"}`}
            onClick={() => {
              setTab("login");
              setErrors({});
              setLoginError("");
            }}
          >
            Login
          </button>
        </div>

        {/* Register Form */}
        {tab === "register" && (
          <form className="flex flex-col gap-4 w-full" onSubmit={handleSubmit}>
            <label className="text-[#002B03] font-bold">Full Name</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Enter your full name"
                value={formData.fullName}
                onChange={e => handleInputChange("fullName", e.target.value)}
                className={`w-full pl-3 pr-3 py-2 rounded-lg bg-[#E6FFE6] border text-[#002B03] font-semibold focus:outline-none focus:ring-2 focus:ring-[#6AC56E] ${errors.fullName ? "border-red-500" : "border-[#BFC4BF]"}`}
              />
            </div>
            {errors.fullName && <p className="text-red-500 text-sm -mt-2">{errors.fullName}</p>}

            <label className="text-[#002B03] font-bold">Email</label>
            <div className="relative">
              <input
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={e => handleInputChange("email", e.target.value)}
                className={`w-full pl-3 pr-3 py-2 rounded-lg bg-[#E6FFE6] border text-[#002B03] font-semibold focus:outline-none focus:ring-2 focus:ring-[#6AC56E] ${errors.email ? "border-red-500" : "border-[#BFC4BF]"}`}
              />
            </div>
            {errors.email && <p className="text-red-500 text-sm -mt-2">{errors.email}</p>}

            <label className="text-[#002B03] font-bold">Password</label>
            <div className="relative">
              <input
                type="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={e => handleInputChange("password", e.target.value)}
                className={`w-full pl-3 pr-3 py-2 rounded-lg bg-[#E6FFE6] border text-[#002B03] font-semibold focus:outline-none focus:ring-2 focus:ring-[#6AC56E] ${errors.password ? "border-red-500" : "border-[#BFC4BF]"}`}
              />
            </div>
            {errors.password && <p className="text-red-500 text-sm -mt-2">{errors.password}</p>}
            <div className="text-xs text-[#002B03]/70 -mt-2">
              Password must be at least 8 characters with uppercase, lowercase, number, and special character (!@#$%^&*)
            </div>

            <label className="text-[#002B03] font-bold">Confirm Password</label>
            <div className="relative">
              <input
                type="password"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={e => handleInputChange("confirmPassword", e.target.value)}
                className={`w-full pl-3 pr-3 py-2 rounded-lg bg-[#E6FFE6] border text-[#002B03] font-semibold focus:outline-none focus:ring-2 focus:ring-[#6AC56E] ${errors.confirmPassword ? "border-red-500" : "border-[#BFC4BF]"}`}
              />
            </div>
            {errors.confirmPassword && <p className="text-red-500 text-sm -mt-2">{errors.confirmPassword}</p>}

            <GameButton type="submit" className="mt-2" disabled={loading || isLoading}>
              {loading || isLoading ? "Registering..." : "Register as Host"}
            </GameButton>
          </form>
        )}

        {/* Login Form */}
        {tab === "login" && (
          <form className="flex flex-col gap-4 w-full" onSubmit={handleLogin}>
            <label className="text-[#002B03] font-bold">Email</label>
            <div className="relative">
              <input
                type="email"
                placeholder="Enter your email"
                value={loginData.email}
                onChange={e => handleLoginInputChange("email", e.target.value)}
                className="w-full pl-3 pr-3 py-2 rounded-lg bg-[#E6FFE6] border text-[#002B03] font-semibold focus:outline-none focus:ring-2 focus:ring-[#6AC56E]"
              />
            </div>

            <label className="text-[#002B03] font-bold">Password</label>
            <div className="relative">
              <input
                type="password"
                placeholder="Enter your password"
                value={loginData.password}
                onChange={e => handleLoginInputChange("password", e.target.value)}
                className="w-full pl-3 pr-3 py-2 rounded-lg bg-[#E6FFE6] border text-[#002B03] font-semibold focus:outline-none focus:ring-2 focus:ring-[#6AC56E]"
              />
            </div>
            {loginError && (
              <div className="text-red-500 text-sm -mt-2">
                {loginError} <button type="button" className="underline ml-2" onClick={() => setTab("register")}>Register</button>
              </div>
            )}
            <GameButton type="submit" className="mt-2" disabled={loading || isLoading}>
              {loading || isLoading ? "Logging in..." : "Login as Host"}
            </GameButton>
          </form>
        )}
      </div>
    </div>
  )
}
