import React from "react"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import ForgotClient from "@/components/auth/forgot-client"
import { apiClient } from "@/lib/api/client"

// Mock apiClient
jest.mock("@/lib/api/client", () => ({
    apiClient: {
        forgotPassword: jest.fn(),
        verifyAccountOtp: jest.fn(),
        resetPassword: jest.fn(),
    },
}))

// Mock next/navigation
jest.mock("next/navigation", () => ({
    useRouter: () => ({
        push: jest.fn(),
    }),
}))

// Mock InputOTP component since it might rely on context/refs that are hard to test in isolation
jest.mock("@/components/ui/input-otp", () => ({
    InputOTP: ({ onChange, value }: any) => (
        <input
            data-testid="otp-input"
            value={value}
            onChange={(e) => onChange(e.target.value)}
        />
    ),
    InputOTPGroup: ({ children }: any) => <div>{children}</div>,
    InputOTPSlot: () => <div>Slot</div>,
}))

describe("ForgotClient OTP Flow", () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    test("completes full flow: email -> otp -> reset", async () => {
        // 1. Mock responses
        ; (apiClient.forgotPassword as jest.Mock).mockResolvedValue({
            success: true,
            data: { message: "OTP sent" },
        })
            ; (apiClient.verifyAccountOtp as jest.Mock).mockResolvedValue({
                success: true,
                data: { message: "Verified" },
            })
            ; (apiClient.resetPassword as jest.Mock).mockResolvedValue({
                success: true,
                data: { success: true, message: "Reset successful" },
            })

        render(<ForgotClient />)

        // 2. Enter Email
        fireEvent.change(screen.getByTestId("forgot-email"), {
            target: { value: "test@example.com" },
        })

        // Trigger form submit directly
        const form = screen.getByTestId("forgot-send").closest("form")
        fireEvent.submit(form!)

        // Verify API was called
        await waitFor(() => {
            expect(apiClient.forgotPassword).toHaveBeenCalledTimes(1)
        })

        // Wait for OTP stage
        await waitFor(() => {
            expect(screen.getByRole("heading", { name: /Verify OTP/i })).toBeInTheDocument()
        })

        // 3. Enter OTP
        fireEvent.change(screen.getByTestId("otp-input"), {
            target: { value: "123456" },
        })
        fireEvent.click(screen.getByRole("button", { name: /Verify OTP/i }))

        // Wait for Reset stage
        await waitFor(() => {
            expect(screen.getByText(/Reset Password/i)).toBeInTheDocument()
        })

        // 4. Reset Password
        fireEvent.change(screen.getByTestId("forgot-new-password"), {
            target: { value: "NewPass123!" },
        })
        fireEvent.change(screen.getByTestId("forgot-confirm-password"), {
            target: { value: "NewPass123!" },
        })
        fireEvent.click(screen.getByTestId("forgot-reset"))

        // Verify success
        await waitFor(() => {
            expect(screen.getByText(/Password reset successful/i)).toBeInTheDocument()
        })

        // Verify API calls
        expect(apiClient.forgotPassword).toHaveBeenCalledWith("test@example.com")
        expect(apiClient.verifyAccountOtp).toHaveBeenCalledWith("test@example.com", "123456")
        expect(apiClient.resetPassword).toHaveBeenCalledWith(expect.objectContaining({
            email: "test@example.com",
            newPassword: "NewPass123!",
        }))
    })
})
