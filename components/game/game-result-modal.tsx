"use client"
import { useRouter } from "next/navigation"
import { X } from "lucide-react"
import { GameButton } from "../ui/game-button"

interface GameResultModalProps {
  open: boolean
  onClose: () => void
  onPlayAgain?: () => void
  onBackToMenu?: () => void
  result: "win" | "lose" | "draw"
  scoreX?: number
  scoreO?: number
}

export function GameResultModal({
  open,
  onClose,
  onPlayAgain,
  onBackToMenu,
  result,
  scoreX,
  scoreO,
}: GameResultModalProps) {
  const router = useRouter()

  if (!open) return null

  let emoji = ""
  let title = ""
  let message = ""
  if (result === "win") {
    emoji = "😊"
    title = "You've won"
    message = "You have won this round!"
  } else if (result === "lose") {
    emoji = "😢"
    title = "You've lost"
    message = "You have lost this round. Try again!"
  } else {
    emoji = "😐"
    title = "It's a draw"
    message = "This round ended in a draw."
  }

  const handleBackToMenu = () => {
    onClose()
    router.push("/dashboard")
  }

  const handlePlayAgain = () => {
    // Prefer an explicit restart callback. If not provided, just refresh the page to menu.
    if (onPlayAgain) {
      onPlayAgain()
    } else {
      // Fallback: go back to dashboard
      const router = useRouter()
      router.push('/dashboard')
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-green-100 border-4 border-green-700 rounded-2xl p-6 sm:p-8 w-[95vw] max-w-xl relative flex flex-col items-center shadow-xl max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 bg-green-800 text-white rounded-full flex items-center justify-center hover:bg-green-700 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        <span className="text-6xl mb-4">{emoji}</span>
        <h2 className="text-2xl font-bold text-green-900 mb-2 text-center">{title}</h2>
        <p className="text-green-800 text-center mb-2">{message}</p>
        <div className="text-lg font-semibold text-green-900 mb-6">
          Score: <span className="text-blue-700">{scoreX ?? 0}</span> -{" "}
          <span className="text-red-700">{scoreO ?? 0}</span>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full justify-center mt-2">
          <GameButton onClick={handlePlayAgain} className="w-full sm:w-56 text-sm sm:text-base py-3">
            Play Again
          </GameButton>
          <GameButton onClick={handleBackToMenu} className="w-full sm:w-56 text-sm sm:text-base py-3">
            Back to Menu
          </GameButton>
        </div>

        {/* Social Sharing & CTA */}
        <div className="mt-6 w-full border-t border-green-600/30 pt-4 flex flex-col items-center gap-3">
          <p className="text-sm text-green-800 font-medium">Share your result!</p>
          <div className="flex gap-3">
            {/* X (Twitter) Share */}
            <button
              onClick={() => window.open(`https://twitter.com/intent/tweet?text=I just ${result === 'win' ? 'won' : 'played'} a match on MOOOVES! Score: ${scoreX}-${scoreO} @makingmoooves`, '_blank')}
              className="p-2 bg-black text-white rounded-full hover:bg-gray-800 transition-colors"
              aria-label="Share on X"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
            </button>

            {/* Instagram Share (Link to profile as fallback since web sharing is limited) */}
            <button
              onClick={() => window.open('https://instagram.com/makingmoooves', '_blank')}
              className="p-2 bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white rounded-full hover:opacity-90 transition-opacity"
              aria-label="Visit on Instagram"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.36-.2 6.78-2.618 6.98-6.98.058-1.28.072-1.689.072-4.948 0-3.259-.014-3.667-.072-4.948-.2-4.36-2.618-6.78-6.98-6.98-1.281-.059-1.689-.073-4.948-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
            </button>
          </div>
          <button
            onClick={() => router.push('/tournaments')}
            className="text-sm text-green-700 hover:text-green-900 underline mt-1 font-semibold"
          >
            Join Upcoming Tournaments
          </button>
        </div>
      </div>
    </div>
  )
}
