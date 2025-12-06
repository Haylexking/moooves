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
      // Fallback: go back to /start-game-options to let the user pick a mode
      const router = useRouter()
      router.push('/start-game-options')
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
            <button
              onClick={() => window.open(`https://twitter.com/intent/tweet?text=I just ${result === 'win' ? 'won' : 'played'} a match on MOOOVES! Score: ${scoreX}-${scoreO}`, '_blank')}
              className="p-2 bg-black text-white rounded-full hover:bg-gray-800 transition-colors"
              aria-label="Share on Twitter"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
            </button>
            <button
              onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.origin)}`, '_blank')}
              className="p-2 bg-[#1877F2] text-white rounded-full hover:bg-[#166fe5] transition-colors"
              aria-label="Share on Facebook"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036c-2.148 0-2.797 1.66-2.797 3.54v1.241h4.44l-.243 2.948h-4.197v8.486c.253.012.507.012.76.012 2.035 0 3.925-.377 5.748-1.075v4.002c-1.75.77-3.66 1.187-5.624 1.187-3.278 0-6.337-1.162-8.711-3.138z" /></svg>
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
