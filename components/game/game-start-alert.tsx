"use client"

import React from "react"
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
            <AlertDialogContent className="max-w-md">
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-center text-xl font-bold">
                        ⚙️ Heads-up, Strategist
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-center space-y-3 pt-2">
                        <p>
                            We noticed a tiny bug — when you stack your symbols in certain patterns,
                            the system may not record your points correctly.
                        </p>
                        <p>
                            It happens to both players, so it won't affect your fair play or chances of winning.
                        </p>
                        <p>
                            Our dev team is already fixing it.
                            <br />
                            In the meantime, stay focused — strategy, not score glitches, decides who wins.
                        </p>
                        <p className="font-semibold text-foreground">
                            Keep making your MOOOVES. 💡
                        </p>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="pt-4">
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
