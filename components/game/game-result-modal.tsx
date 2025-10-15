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
      <div className="bg-green-100 border-4 border-green-700 rounded-2xl p-8 w-full max-w-xl min-w-[340px] sm:min-w-[420px] relative flex flex-col items-center shadow-xl">
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
          <GameButton onClick={handlePlayAgain} className="w-full sm:w-56 text-base py-3">
            Play Again
          </GameButton>
          <GameButton onClick={handleBackToMenu} className="w-full sm:w-56 text-base py-3">
            Back to Menu
          </GameButton>
        </div>
      </div>
    </div>
  )
}
