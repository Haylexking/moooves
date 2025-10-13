"use client"

import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'

export default function GameRulesModal({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl w-[95vw] sm:w-3/4">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}>
          <DialogHeader>
            <DialogTitle>How to Play MOOOVES</DialogTitle>
          </DialogHeader>

          <div className="prose max-h-[60vh] overflow-auto text-sm text-gray-800">
            <h3>How to Play MOOOVES</h3>
            <h4>1. The Basics</h4>
            <p>
              MOOOVES is a strategy game inspired by tic-tac-toe — but instead of 3 in a row, you need to make 5 in a
              row. You’ll play on a <strong>30×30 grid</strong>, giving you hundreds of possibilities.
            </p>
            <p>
              <strong>Your goal:</strong> Score as many 5-in-a-row lines as you can within 10 minutes. You can win
              horizontally, vertically, or diagonally.
            </p>

            <hr />
            <h4>2. Symbols</h4>
            <p>
              You’ll play as either <strong>X</strong> or <strong>O</strong>. When the match starts, MOOOVES randomly
              assigns your symbol. Players take turns placing one mark at a time.
            </p>

            <hr />
            <h4>3. How to Score</h4>
            <p>
              Each time you make a straight line of <strong>5 of your symbols</strong>, you earn <strong>1 point</strong>.
              That line <strong>locks automatically</strong> — it can’t be used again. You then keep playing to form new
              lines in different parts of the grid. At the end of <strong>10 minutes</strong>, the player with the
              highest score wins.
            </p>

            <hr />
            <h4>4. Strategy Tips</h4>
            <ul>
              <li><strong>Defend and Attack:</strong> Watch your opponent’s moves and block potential 5-in-a-row lines.</li>
              <li><strong>Build multiple paths:</strong> Create traps — one move should open two or more scoring options.</li>
              <li><strong>Stay calm:</strong> Every MOOOVE counts; don’t rush.</li>
              <li><strong>Play like life:</strong> It’s not just about winning a round — it’s about seeing patterns before they form.</li>
            </ul>

            <hr />
            <h4>5. TL;DR — Quick Recap</h4>
            <ul>
              <li>🎯 <strong>Goal:</strong> Get 5 in a row to score points.</li>
              <li>🧩 <strong>Grid:</strong> 30×30 board.</li>
              <li>⏱️ <strong>Time:</strong> 10 minutes per match.</li>
              <li>🏆 <strong>Win:</strong> Highest score at the end.</li>
            </ul>
          </div>

          <DialogFooter>
            <div className="w-full flex justify-end">
              <Button onClick={() => onOpenChange(false)}>Got It</Button>
            </div>
          </DialogFooter>
        </motion.div>
      </DialogContent>
    </Dialog>
  )
}
