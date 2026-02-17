"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Pencil } from "lucide-react"

export default function AdminSettingsPage() {
    return (
        <div className="p-6 max-w-[1600px] mx-auto min-h-screen space-y-6">

            <h2 className="text-2xl font-bold dark:text-white mb-6">Settings</h2>

            <Card className="border-none shadow-sm bg-white dark:bg-gray-900">
                <CardContent className="p-8 space-y-8">

                    {/* Profile Header */}
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <Avatar className="w-16 h-16 border-2 border-white shadow-sm">
                                    <AvatarImage src="/admin-avatar.png" />
                                    <AvatarFallback>JD</AvatarFallback>
                                </Avatar>
                                <div className="absolute bottom-0 right-0 bg-white p-1 rounded-full shadow border border-gray-100 cursor-pointer">
                                    <Pencil className="w-3 h-3 text-gray-600" />
                                </div>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">John Doe</h3>
                                <p className="text-sm text-gray-500">Admin</p>
                            </div>
                        </div>
                        <Button variant="outline" className="border-gray-200 text-gray-600 font-bold hover:bg-gray-50">Change password</Button>
                    </div>

                    {/* Profile Settings Form */}
                    <div>
                        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-6">Profile setting</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
                            <div className="space-y-3">
                                <Label className="font-bold text-gray-700 dark:text-gray-300">First name</Label>
                                <Input defaultValue="John" className="h-12 bg-white border-gray-200 focus:border-green-500 font-medium text-lg" />
                            </div>
                            <div className="space-y-3">
                                <Label className="font-bold text-gray-700 dark:text-gray-300">Last name</Label>
                                <Input defaultValue="Doe" className="h-12 bg-white border-gray-200 focus:border-green-500 font-medium text-lg" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                            <div className="space-y-3">
                                <Label className="font-bold text-gray-700 dark:text-gray-300">Business email</Label>
                                <Input defaultValue="Admin@moooves.com" className="h-12 bg-white border-gray-200 focus:border-green-500 font-medium text-lg" />
                            </div>
                            <div className="space-y-3">
                                <Label className="font-bold text-gray-700 dark:text-gray-300">Private email</Label>
                                <Input defaultValue="Johndoe@gmail.com" className="h-12 bg-white border-gray-200 focus:border-green-500 font-medium text-lg" />
                            </div>
                        </div>

                        <div className="flex justify-start">
                            <Button variant="outline" className="border-gray-200 text-gray-600 font-bold h-10 px-6">Update changes</Button>
                        </div>
                    </div>

                    {/* Security Setting */}
                    <div>
                        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4">Security setting</h3>

                        <div className="p-6 bg-gray-50 dark:bg-gray-800/50 rounded-xl flex items-center justify-between">
                            <span className="font-bold text-gray-700 dark:text-gray-300 text-lg">Two-factor authentication</span>
                            <Switch className="data-[state=checked]:bg-[#468549]" defaultChecked />
                        </div>

                        <div className="flex justify-end mt-4">
                            <Button variant="outline" className="border-gray-200 text-gray-600 font-bold h-10 px-6">Update changes</Button>
                        </div>
                    </div>

                    {/* Notification Setting */}
                    <div>
                        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4">Notification setting</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl flex items-center justify-between h-16">
                                <span className="font-bold text-gray-700 dark:text-gray-300">Message notification</span>
                                <Switch className="data-[state=checked]:bg-[#468549]" defaultChecked />
                            </div>
                            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl flex items-center justify-between h-16">
                                <span className="font-bold text-gray-700 dark:text-gray-300">Tournament Notification</span>
                                <Switch className="data-[state=checked]:bg-[#468549]" defaultChecked />
                            </div>
                            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl flex items-center justify-between h-16">
                                <span className="font-bold text-gray-700 dark:text-gray-300">Payment Notification</span>
                                <Switch className="data-[state=checked]:bg-[#468549]" />
                            </div>
                        </div>

                        <div className="flex justify-end mt-4">
                            <Button variant="outline" className="border-gray-200 text-gray-600 font-bold h-10 px-6">Update changes</Button>
                        </div>
                    </div>

                </CardContent>
            </Card>

        </div>
    )
}
