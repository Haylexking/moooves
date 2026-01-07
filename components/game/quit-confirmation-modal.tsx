"use client"

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface QuitConfirmationModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onConfirm: () => void
}

export function QuitConfirmationModal({
    open,
    onOpenChange,
    onConfirm,
}: QuitConfirmationModalProps) {
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent className="bg-gray-900 border-red-500/50 text-white sm:max-w-md">
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-2xl font-bold text-red-500">
                        Forfeit Match?
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-gray-300 text-base">
                        Are you sure you want to quit? This will forfeit the current match and count as a loss.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="mt-4 gap-3 sm:gap-0">
                    <AlertDialogCancel className="bg-gray-800 text-white hover:bg-gray-700 border-gray-700">
                        Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={(e) => {
                            e.preventDefault()
                            onConfirm()
                        }}
                        className="bg-red-600 hover:bg-red-700 text-white font-bold px-8"
                    >
                        Forfeit & Quit
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
