"use client"

import React, { useState } from "react"
import { useAuthStore } from "@/lib/stores/auth-store"

export function LoginForm() {
  const auth = useAuthStore() as any
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (typeof auth?.login === "function") {
      auth.login(email, password)
    }
    if (typeof auth?.setUser === "function") {
      auth.setUser({ id: "login-mock", email, fullName: email, role: (auth.user && auth.user.role) || "player" })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 block w-full border rounded-md px-3 py-2"
        />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 block w-full border rounded-md px-3 py-2"
        />
      </div>
      <button type="submit" className="px-4 py-2 rounded bg-green-600 text-white font-semibold">
        Sign In
      </button>
    </form>
  )
}

export default LoginForm
