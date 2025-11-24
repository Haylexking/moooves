"use client"

import { useState } from "react"
import { X, Bell, Save } from "lucide-react"
import { GameButton } from "@/components/ui/game-button"
import { useAuthStore } from "@/lib/stores/auth-store"
import { toast } from "@/hooks/use-toast"
import { apiClient } from "@/lib/api/client"

interface SettingsModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
    const { user, refreshUser } = useAuthStore()
    const [enabled, setEnabled] = useState(user?.notificationsEnabled ?? true)
    const [saving, setSaving] = useState(false)

    if (!open) return null

    const handleSave = async () => {
        if (!user) return
        setSaving(true)
        try {
            // Optimistic update
            const updatedUser = { ...user, notificationsEnabled: enabled }

            // Call API to update user settings
            // Note: Assuming the backend supports partial updates via PUT /users/:id
            const res = await apiClient.updateUser(user.id, { notificationsEnabled: enabled })

            if (res.success) {
                toast({ title: "Settings saved", description: "Your notification preferences have been updated." })
                await refreshUser() // Refresh local user state
                onOpenChange(false)
            } else {
                // If API fails, we might still want to save locally for demo purposes if backend isn't ready
                // But for now, show error
                toast({ title: "Failed to save", description: res.error || "Could not update settings", variant: "destructive" })
            }
        } catch (err) {
            toast({ title: "Error", description: "Something went wrong", variant: "destructive" })
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="relative bg-white border-4 border-green-600 rounded-2xl p-6 sm:p-8 w-full max-w-md shadow-2xl">
                <button
                    onClick={() => onOpenChange(false)}
                    className="absolute top-4 right-4 w-8 h-8 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <Bell className="w-6 h-6 text-green-600" /> Settings
                </h2>

                <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <div>
                            <h3 className="font-semibold text-gray-900">Tournament Notifications</h3>
                            <p className="text-sm text-gray-500">Receive email alerts for match starts</p>
                        </div>
                        <button
                            onClick={() => setEnabled(!enabled)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${enabled ? "bg-green-600" : "bg-gray-200"
                                }`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${enabled ? "translate-x-6" : "translate-x-1"
                                    }`}
                            />
                        </button>
                    </div>

                    <GameButton onClick={handleSave} disabled={saving} className="w-full">
                        {saving ? "Saving..." : "Save Changes"}
                    </GameButton>
                </div>
            </div>
        </div>
    )
}
