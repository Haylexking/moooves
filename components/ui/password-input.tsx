"use client"

import React, { useMemo, useState } from "react"
import { Eye, EyeOff } from "lucide-react"
import { cn } from "@/lib/utils"

type PasswordInputProps = React.ComponentProps<"input"> & {
  showStrength?: boolean
}

export function PasswordInput({ className, showStrength = false, ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false)

  const value = (props.value as string) || ""

  const checks = useMemo(() => ({
    length: value.length >= 8,
    lower: /[a-z]/.test(value),
    upper: /[A-Z]/.test(value),
    number: /[0-9]/.test(value),
    special: /[!@#$%^&*]/.test(value),
  }), [value])

  const score = useMemo(() => {
    return [checks.length, checks.lower, checks.upper, checks.number, checks.special].filter(Boolean).length
  }, [checks])

  return (
    <div className="relative">
      <input
        {...props}
        type={visible ? "text" : "password"}
        className={cn(
          "w-full pl-3 pr-10 py-2 rounded-lg bg-[#E6FFE6] border text-[#002B03] font-semibold focus:outline-none focus:ring-2 focus:ring-[#6AC56E]",
          className
        )}
      />

      <button
        type="button"
        aria-label={visible ? "Hide password" : "Show password"}
        onClick={() => setVisible((v) => !v)}
        className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center w-8 h-8 text-[#002B03]"
      >
        {visible ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
      </button>

      {showStrength && (
        <div className="mt-2">
          <div className="h-2 w-full bg-[#E6FFE6] rounded overflow-hidden border border-[#BFC4BF]">
            <div
              data-testid="password-strength-bar"
              className="h-full bg-gradient-to-r from-green-400 to-green-600"
              style={{ width: `${(score / 5) * 100}%` }}
            />
          </div>

          <div className="mt-2 text-xs text-[#002B03]/80 grid grid-cols-2 gap-1">
            <div className={checks.length ? "text-green-600" : "text-red-500"}>• 8+ chars</div>
            <div className={checks.lower ? "text-green-600" : "text-red-500"}>• lowercase</div>
            <div className={checks.upper ? "text-green-600" : "text-red-500"}>• UPPERCASE</div>
            <div className={checks.number ? "text-green-600" : "text-red-500"}>• number</div>
            <div className={checks.special ? "text-green-600" : "text-red-500"}>• special (!@#$%^&*)</div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PasswordInput
