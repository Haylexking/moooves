"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { GameButton } from "@/components/ui/game-button"

interface GameStartAlertProps {
  open: boolean
  onContinue: () => void
}

export function GameStartAlert({ open, onContinue }: GameStartAlertProps) {
  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="max-w-md w-[min(92vw,26rem)] mx-4 sm:mx-auto rounded-2xl p-0 shadow-2xl">
        <AlertDialogHeader className="px-6 pt-6">
          <AlertDialogTitle className="text-center text-xl font-bold">
            Heads-up, Strategist
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center space-y-3 pt-2 text-sm text-muted-foreground">
            <p>
              We noticed a tiny bug — when you stack your symbols in certain patterns, the system may not record your
              points correctly.
            </p>
            <p>It happens to both players, so it won&apos;t affect your fair play or chances of winning.</p>
            <p>
              Our dev team is already fixing it.
              <br />
              In the meantime, stay focused — strategy, not score glitches, decides who wins.
            </p>
            <p className="font-semibold text-foreground">Keep making your MOOOVES.</p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="px-6 pb-6">
          <AlertDialogAction asChild>
            <GameButton onClick={onContinue} className="w-full">
              Continue
            </GameButton>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
