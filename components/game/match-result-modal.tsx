
import React from "react"
import { X } from "lucide-react"

interface MatchResultModalProps {
  open: boolean
  onClose: () => void
  result: "win" | "lose"
}

export function MatchResultModal({ open, onClose, result }: MatchResultModalProps) {
  if (!open) return null

  const isWin = result === "win"
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-green-100 border-4 border-green-700 rounded-2xl p-8 w-full max-w-md relative flex flex-col items-center shadow-xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 bg-green-800 text-white rounded-full flex items-center justify-center hover:bg-green-700 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        <span className="text-6xl mb-4">
          {isWin ? "🥳" : "😬"}
        </span>
        <h2 className="text-2xl font-bold text-green-900 mb-2 text-center">
          {isWin ? "You’ve won!" : "You’ve lost"}
        </h2>
        <p className="text-green-800 text-center mb-6">
          {isWin
            ? "Congratulations! You won the tournament."
            : "You have lost the tournament, visit our channel to find another tournament"}
        </p>
        <div className="flex gap-4 w-full justify-center">
          <a
            href="http://t.me/curatedforclam"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-700 text-white font-bold hover:bg-green-800 transition-colors"
          >
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M9.036 15.956l-.398 3.52c.57 0 .818-.244 1.116-.537l2.676-2.537 5.547 4.045c1.017.561 1.74.266 1.99-.941l3.607-16.84c.33-1.527-.553-2.127-1.54-1.76L1.36 9.36c-1.49.58-1.473 1.41-.254 1.788l4.6 1.438 10.68-6.74c.5-.32.96-.143.58.177"/></svg>
            Telegram
          </a>
          <a
            href="https://chat.whatsapp.com/FD1BmxFTU1KLr65PnhDB6T?mode=ems_copy_t"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-700 text-white font-bold hover:bg-green-800 transition-colors"
          >
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M20.52 3.48A11.93 11.93 0 0 0 12 0C5.37 0 0 5.37 0 12c0 2.11.55 4.16 1.6 5.97L0 24l6.19-1.62A11.93 11.93 0 0 0 12 24c6.63 0 12-5.37 12-12 0-3.19-1.24-6.19-3.48-8.52zM12 22c-1.85 0-3.68-.5-5.25-1.44l-.38-.22-3.68.97.98-3.58-.25-.37A9.94 9.94 0 0 1 2 12c0-5.52 4.48-10 10-10s10 4.48 10 10-4.48 10-10 10zm5.47-7.1c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.27-.47-2.42-1.5-.9-.8-1.5-1.77-1.67-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.5-.5-.67-.5-.17 0-.37-.02-.57-.02-.2 0-.52.07-.8.37-.27.3-1.05 1.02-1.05 2.5 0 1.47 1.07 2.9 1.22 3.1.15.2 2.1 3.2 5.1 4.36.71.24 1.26.38 1.69.48.71.15 1.36.13 1.87.08.57-.06 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.08-.12-.28-.2-.58-.35z"/></svg>
            Whatsapp
          </a>
        </div>
      </div>
    </div>
  )
}
