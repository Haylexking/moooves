import React from "react"

interface GameButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  variant?: "default" | "pressed"
}

export const GameButton = React.forwardRef<HTMLButtonElement, GameButtonProps>(
  ({ children, variant = "default", disabled, className, ...props }, ref) => {
    // Default: MUCH DARKER Gray background with white text
    // Pressed: Green gradient background with white text (only during click)
    let bg = "bg-gradient-to-br from-[#4A5A4A] to-[#1A2A1A]" // Much darker grey gradient
    let shadow = [
      "shadow-[0_4px_16px_rgba(0,0,0,0.4)]",
      "shadow-[4px_4px_12px_0_rgba(26,42,26,0.8)]",
      "shadow-[-4px_-4px_12px_0_rgba(26,42,26,0.8)]",
      "shadow-[2px_2px_2px_0_rgba(74,90,74,0.6)]",
      "shadow-[-2px_-2px_2px_0_rgba(74,90,74,0.6)]",
    ].join(" ")

    // Pressed state (green gradient with specified colors)
    if (variant === "pressed") {
      bg = "bg-gradient-to-br from-[#6AC56E] to-[#002B03]"
      shadow = "shadow-[0_4px_16px_rgba(0,0,0,0.25),0_4px_24px_#6AC56E,0_0px_0px_#002B03]"
    }

    const border = "border border-[#2A3A2A]" // Darker border to match
    const text = "text-white" // Always white text
    const textShadow = variant === "pressed" ? "0 2px 8px #000, 0 0 8px #00ff80" : "0 2px 8px #1A2A1A, 0 0 8px #4A5A4A"

    return (
      <button
        ref={ref}
        disabled={disabled}
        className={[
          "relative w-full h-12 sm:h-[52px] px-4 sm:px-8 flex items-center justify-center font-extrabold text-base sm:text-lg transition-all duration-150 active:scale-95 touch-manipulation",
          "rounded-[12px] outline-none focus:outline-none",
          border,
          text,
          bg,
          shadow,
          disabled
            ? "opacity-60 cursor-not-allowed"
            : [
              // Hover state - GREEN GRADIENT with specified colors
              "hover:bg-gradient-to-br hover:from-[#6AC56E] hover:to-[#002B03]",
              "hover:shadow-[0_4px_16px_rgba(0,0,0,0.25),0_2px_12px_#6AC56E]",
              "hover:border-[#6AC56E]",
              // Active/Pressed state - SAME GREEN GRADIENT but with scale effect
              "active:bg-gradient-to-br active:from-[#6AC56E] active:to-[#002B03]",
              "active:shadow-[0_4px_16px_rgba(0,0,0,0.35),0_4px_24px_#6AC56E]",
              "active:scale-95",
              "active:border-[#6AC56E]",
            ].join(" "),
          className,
        ].join(" ")}
        style={{
          textShadow,
        }}
        {...props}
      >
        <span className="relative z-10 w-full select-none whitespace-nowrap flex items-center justify-center gap-2">{children}</span>
      </button>
    )
  },
)
GameButton.displayName = "GameButton"
