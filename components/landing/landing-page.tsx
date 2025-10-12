"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import PasswordInput from "@/components/ui/password-input"
import { Label } from "@/components/ui/label"
import { useAuthStore } from "@/lib/stores/auth-store"
import { Trophy, Users, Zap, Shield } from "lucide-react"

export function LandingPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [phone, setPhone] = useState("")
  const { login, register, isLoading } = useAuthStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (isLogin) {
        await login(email, password)
      } else {
        await register(email, password, phone)
      }
    } catch (error) {
      console.error("Auth error:", error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Welcome to <span className="text-blue-600">MOOOVES</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Play enhanced tic-tac-toe tournaments, compete with friends, and earn real money. The ultimate mobile gaming
            platform for Gen Z in Africa.
          </p>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <Trophy className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Win Real Money</h3>
              <p className="text-gray-600">
                Compete in tournaments and earn cash prizes. Top 3 players share 40% of the prize pool.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <Users className="w-12 h-12 text-blue-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Host Tournaments</h3>
              <p className="text-gray-600">
                Create your own tournaments and earn 50% of the entry pool. Unlock hosting after 2 games.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <Zap className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Fast-Paced Games</h3>
              <p className="text-gray-600">
                10-minute matches on a 30x30 grid. Score points by getting 5 in a row in any direction.
              </p>
            </div>
          </div>
        </div>

        {/* Auth Section */}
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-center">{isLogin ? "Sign In to MOOOVES" : "Join MOOOVES"}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>

                <div>
                  <Label htmlFor="password">Password</Label>
                  <PasswordInput
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    showStrength={!isLogin}
                    required
                  />
                </div>

                {!isLogin && (
                  <div>
                    <Label htmlFor="phone">Phone (Optional)</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+234..."
                    />
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Loading..." : isLogin ? "Sign In" : "Create Account"}
                </Button>
              </form>

              <div className="mt-4 text-center">
                <button type="button" onClick={() => setIsLogin(!isLogin)} className="text-blue-600 hover:underline">
                  {isLogin ? "Need an account? Sign up" : "Already have an account? Sign in"}
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Security Note */}
          <div className="mt-6 text-center text-sm text-gray-600 flex items-center justify-center gap-2">
            <Shield className="w-4 h-4" />
            <span>Secure payments via Flutterwave & Paystack</span>
          </div>
        </div>
      </div>
    </div>
  )
}
