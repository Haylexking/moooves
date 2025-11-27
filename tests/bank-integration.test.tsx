import React from "react"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { BankLinkForm } from "@/components/ui/bank-link-form"
import { apiClient } from "@/lib/api/client"
import { useAuthStore } from "@/lib/stores/auth-store"

// Mock apiClient
jest.mock("@/lib/api/client", () => ({
    apiClient: {
        listBanks: jest.fn(),
        findBankByName: jest.fn(),
        verifyBankAccount: jest.fn(),
        addBank: jest.fn(),
    },
}))

// Mock auth store
jest.mock("@/lib/stores/auth-store", () => ({
    useAuthStore: jest.fn(),
}))

describe("BankLinkForm Integration", () => {
    const mockUser = { id: "user-123", role: "user" }

    beforeEach(() => {
        jest.clearAllMocks()
            ; (useAuthStore as unknown as jest.Mock).mockReturnValue({ user: mockUser })
            ; (apiClient.listBanks as jest.Mock).mockResolvedValue({
                success: true,
                data: [{ name: "Test Bank", code: "001" }],
            })
    })

    test("verifies and saves bank details correctly", async () => {
        // Mock verification success
        ; (apiClient.verifyBankAccount as jest.Mock).mockResolvedValue({
            success: true,
            data: { account_name: "John Doe", account_number: "1234567890", bank_code: "001" },
        })

            // Mock save success
            ; (apiClient.addBank as jest.Mock).mockResolvedValue({
                success: true,
                data: { id: "bank-1", accountName: "John Doe" },
            })

        render(<BankLinkForm />)

        // Wait for banks to load
        await waitFor(() => expect(apiClient.listBanks).toHaveBeenCalled())

        // 1. Enter details
        fireEvent.change(screen.getByPlaceholderText(/Account Number/i), {
            target: { value: "1234567890" },
        })

        // Select bank (simulating datalist selection)
        const bankInput = screen.getByPlaceholderText(/Search and select your bank/i)
        fireEvent.change(bankInput, { target: { value: "Test Bank" } })

        // 2. Click Verify
        const verifyBtn = screen.getByRole("button", { name: /Verify Account/i })
        fireEvent.click(verifyBtn)

        // Wait for verification
        await waitFor(() => {
            expect(screen.getByText(/Account Name: John Doe/i)).toBeInTheDocument()
        })

        // 3. Click Save
        const saveBtn = screen.getByRole("button", { name: /Save Bank Details/i })
        expect(saveBtn).not.toBeDisabled()
        fireEvent.click(saveBtn)

        // 4. Verify addBank call
        await waitFor(() => {
            expect(apiClient.addBank).toHaveBeenCalledTimes(1)
            // Check what was actually passed to addBank (client transforms it, but test mocks client method)
            // The transformation happens INSIDE addBank.
            // So the mock should still receive camelCase arguments from the component.
            expect(apiClient.addBank).toHaveBeenCalledWith({
                accountNumber: "1234567890",
                bankCode: "001",
                role: "user",
                userId: "user-123",
            })
        })
    })
})
