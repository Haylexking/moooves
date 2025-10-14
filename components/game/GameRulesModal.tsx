"use client"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { GameButton } from "@/components/ui/game-button"
import { motion } from "framer-motion"
import { X } from "lucide-react"

export default function GameRulesModal({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-[95vw] sm:w-[90vw] p-0 bg-[#E6FFE6] border-4 border-[#6AC56E] rounded-3xl overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          className="relative"
        >
          <button
            onClick={() => onOpenChange(false)}
            className="absolute top-4 right-4 z-50 w-10 h-10 rounded-full bg-[#002B03] text-white flex items-center justify-center hover:bg-[#004505] transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="bg-[#E6FFE6] px-6 py-6 border-b-2 border-[#6AC56E]">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#002B03] text-center">Game Rules</h2>
          </div>

          <div className="max-h-[60vh] overflow-y-auto px-6 py-6 space-y-6">
            <div className="bg-[#D4F5D4] rounded-xl p-4 space-y-3">
              <h3 className="font-bold text-lg text-[#002B03]">1. The Basics</h3>
              <ul className="space-y-2 text-[#002B03] text-sm leading-relaxed">
                <li>
                  • MOOOVES is a strategy game inspired by tic-tac-toe — but instead of 3 in a row, you need to make 5
                  in a row.
                </li>
                <li>
                  • You'll play on a <strong>30×30 grid</strong>, giving you hundreds of possibilities.
                </li>
                <li>
                  • <strong>Your goal:</strong> Score as many 5-in-a-row lines as you can within 10 minutes.
                </li>
                <li>• You can win horizontally, vertically, or diagonally.</li>
              </ul>
            </div>

            <div className="bg-[#D4F5D4] rounded-xl p-4 space-y-3">
              <h3 className="font-bold text-lg text-[#002B03]">2. Symbols</h3>
              <ul className="space-y-2 text-[#002B03] text-sm leading-relaxed">
                <li>
                  • You'll play as either <strong>X</strong> or <strong>O</strong>.
                </li>
                <li>• When the match starts, MOOOVES randomly assigns your symbol.</li>
                <li>• Players take turns placing one mark at a time.</li>
              </ul>
            </div>

            <div className="bg-[#D4F5D4] rounded-xl p-4 space-y-3">
              <h3 className="font-bold text-lg text-[#002B03]">3. How to Score</h3>
              <ul className="space-y-2 text-[#002B03] text-sm leading-relaxed">
                <li>
                  • Each time you make a straight line of <strong>5 of your symbols</strong>, you earn{" "}
                  <strong>1 point</strong>.
                </li>
                <li>
                  • That line <strong>locks automatically</strong> — it can't be used again.
                </li>
                <li>• You then keep playing to form new lines in different parts of the grid.</li>
                <li>
                  • At the end of <strong>10 minutes</strong>, the player with the highest score wins.
                </li>
              </ul>
            </div>

            <div className="bg-[#D4F5D4] rounded-xl p-4 space-y-3">
              <h3 className="font-bold text-lg text-[#002B03]">4. Strategy Tips</h3>
              <ul className="space-y-2 text-[#002B03] text-sm leading-relaxed">
                <li>
                  • <strong>Defend and Attack:</strong> Watch your opponent's moves and block potential 5-in-a-row
                  lines.
                </li>
                <li>
                  • <strong>Build multiple paths:</strong> Create traps — one move should open two or more scoring
                  options.
                </li>
                <li>
                  • <strong>Stay calm:</strong> Every MOOOVE counts; don't rush.
                </li>
                <li>
                  • <strong>Play like life:</strong> It's not just about winning a round — it's about seeing patterns
                  before they form.
                </li>
              </ul>
            </div>

            <div className="bg-[#D4F5D4] rounded-xl p-4 space-y-3">
              <h3 className="font-bold text-lg text-[#002B03]">5. Quick Recap</h3>
              <ul className="space-y-2 text-[#002B03] text-sm leading-relaxed">
                <li>
                  • <strong>Goal:</strong> Get 5 in a row to score points.
                </li>
                <li>
                  • <strong>Grid:</strong> 30×30 board.
                </li>
                <li>
                  • <strong>Time:</strong> 10 minutes per match.
                </li>
                <li>
                  • <strong>Win:</strong> Highest score at the end.
                </li>
              </ul>
            </div>
          </div>

          <div className="px-6 py-4 bg-[#E6FFE6] border-t-2 border-[#6AC56E] flex justify-center">
            <GameButton onClick={() => onOpenChange(false)} className="px-8">
              Got It!
            </GameButton>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  )
}
