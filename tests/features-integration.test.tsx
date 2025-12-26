
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react"
import { BattleGround } from "@/components/game/battle-ground"
import { LiveMatch } from "@/components/game/live-match"
import { JoinTournamentFlow } from "@/components/tournament/join-tournament-flow"
import { apiClient } from "@/lib/api/client"
import { useAuthStore } from "@/lib/stores/auth-store"
import { useGameStore } from "@/lib/stores/game-store"
import { useMatchRoom } from "@/lib/hooks/use-match-room"
import { GameRulesProvider } from "@/components/game/GameRulesProvider"

// Mock dependencies
jest.mock("@/lib/api/client", () => ({
    apiClient: {
        createLiveMatch: jest.fn(),
        joinMatchByCode: jest.fn(),
        initWalletTransaction: jest.fn(),
        verifyWalletTransaction: jest.fn(),
        joinTournamentWithCode: jest.fn(),
        getMatchRoom: jest.fn(),
    },
}))

jest.mock("next/navigation", () => ({
    useRouter: () => ({
        push: jest.fn(),
        replace: jest.fn(),
    }),
    useSearchParams: () => new URLSearchParams(window.location.search),
}))

jest.mock("@/lib/hooks/use-match-room", () => ({
    useMatchRoom: () => ({
        getRoomDetails: jest.fn(),
        participants: [],
        matchState: null,
    }),
}))

// Mock Toast
jest.mock("@/hooks/use-toast", () => ({
    useToast: () => ({
        toast: jest.fn(),
    }),
}))

describe("Comprehensive Feature Tests", () => {
    beforeEach(() => {
        jest.clearAllMocks()
        useAuthStore.setState({ user: { id: "user-1", email: "test@test.com", fullName: "Test User" } as any })
        useGameStore.setState({
            board: Array(30).fill(null).map(() => Array(30).fill(null)),
            currentPlayer: "X",
            gameStatus: "playing",
        })
    })

    afterEach(() => {
        jest.restoreAllMocks()
    })

    describe("Live Match Feature", () => {
        it("should handle Match Creation correctly (using correct Swagger keys)", async () => {
            // Setup Mock
            (apiClient.createLiveMatch as jest.Mock).mockResolvedValue({
                success: true,
                data: { matchCode: "CODE123", roomId: "room-123" }, // Swagger keys
            })

            render(<LiveMatch />)

            // Click Create
            const createBtn = screen.getByText(/Create Match/i)
            fireEvent.click(createBtn)

            // Expect API call
            expect(apiClient.createLiveMatch).toHaveBeenCalledWith("user-1")

            // Expect State Update (Code displayed)
            await waitFor(() => {
                expect(screen.getByText("CODE123")).toBeInTheDocument()
            })
        })

        it("should handle Joining by Code correctly", async () => {
            const mockPush = jest.fn()
            const mockReplace = jest.fn()
            jest.spyOn(require("next/navigation"), "useRouter").mockReturnValue({ push: mockPush, replace: mockReplace });

            (apiClient.joinMatchByCode as jest.Mock).mockResolvedValue({
                success: true,
                data: { matchId: "match-456" },
            })

            render(<LiveMatch />)

            // Navigate to Join
            fireEvent.click(screen.getByText(/Join Match/i))

            // Input Code
            const input = screen.getByPlaceholderText(/Enter Code/i)
            fireEvent.change(input, { target: { value: "CODE123" } })

            // Click Join
            fireEvent.click(screen.getByText("Join Game"))

            await waitFor(() => {
                expect(apiClient.joinMatchByCode).toHaveBeenCalledWith("CODE123", "user-1")
                expect(mockPush).toHaveBeenCalledWith("/game?live=true&id=match-456")
            })
        })
    })

    describe("Tournament Payment Flow", () => {
        const mockTournament = {
            id: "tour-1",
            entryFee: 100,
            name: "Test Tourney",
            totalPool: 10000
        } as any

        it("should initiate payment and handle redirect url", async () => {
            // Mock window.location
            const originalLocation = window.location
            delete (window as any).location
            window.location = { ...originalLocation, href: "", pathname: "/tournaments/tour-1" } as any;

            // Mock Init call
            (apiClient.initWalletTransaction as jest.Mock).mockResolvedValue({
                success: true,
                data: { payment_link: "https://pay.gateway/checkout" },
            })

            // Setup LocalStorage Spy
            const setItemSpy = jest.spyOn(Storage.prototype, "setItem")

            render(<JoinTournamentFlow tournament={mockTournament} inviteCode="INV-1" />)

            // Click Join (Pay)
            const payBtn = screen.getByText(/Join Tournament.*100/i)
            fireEvent.click(payBtn)

            await waitFor(() => {
                expect(apiClient.initWalletTransaction).toHaveBeenCalled()
                // Check if redirect happened
                // Check persistence
                expect(setItemSpy).toHaveBeenCalledWith("pending_tournament_join", expect.stringContaining("tour-1"))
            })

            // Restore
            window.location = originalLocation as any
        })

        it("should verify payment and complete join on return", async () => {
            // Setup URL params (?transaction_id=tx_999)
            const searchParams = new URLSearchParams()
            searchParams.set("transaction_id", "tx_999")
            jest.spyOn(require("next/navigation"), "useSearchParams").mockReturnValue(searchParams)

            // Setup LocalStorage (Pending Join)
            jest.spyOn(Storage.prototype, "getItem").mockReturnValue(JSON.stringify({
                tournamentId: "tour-1",
                inviteCode: "INV-1"
            }));

            // API Mocks
            (apiClient.verifyWalletTransaction as jest.Mock).mockResolvedValue({ success: true });
            (apiClient.joinTournamentWithCode as jest.Mock).mockResolvedValue({ success: true })

            render(<JoinTournamentFlow tournament={mockTournament} inviteCode="INV-1" />)

            await waitFor(() => {
                expect(apiClient.verifyWalletTransaction).toHaveBeenCalledWith({ transactionId: "tx_999" })
                expect(apiClient.joinTournamentWithCode).toHaveBeenCalledWith("INV-1", "user-1")
                expect(screen.getByText(/You're in!/i)).toBeInTheDocument()
            })
        })
    })

    describe("Gameplay Interaction (Mobile vs Desktop)", () => {
        let makeMoveSpy: any

        beforeEach(() => {
            makeMoveSpy = jest.spyOn(useGameStore.getState(), "makeMove")
        })

        it("should require DOUBLE TAP on Mobile", () => {
            // Simulate Mobile
            window.matchMedia = jest.fn().mockImplementation(query => ({
                matches: query === '(max-width: 768px)',
                media: query,
                onchange: null,
                addListener: jest.fn(),
                removeListener: jest.fn(),
                addEventListener: jest.fn(),
                removeEventListener: jest.fn(),
                dispatchEvent: jest.fn(),
            }))

            render(
                <GameRulesProvider>
                    <BattleGround gameMode="player-vs-player" />
                </GameRulesProvider>
            )

            // Force mobile check effect to run
            act(() => {
                window.dispatchEvent(new Event('resize'))
            })

            // Find a cell (assuming they are buttons)
            const cells = screen.getAllByRole("button")
            // First few buttons might be UI controls (created by GameRulesProvider etc)
            // Cell buttons often have class "game-cell". Or just pick one from the middle.
            // The grid has 900 cells.
            const cell0 = cells.find(c => c.className.includes("game-cell") || c.getAttribute('data-cell') !== null) || cells[10]

            // First Click -> Select (Cursor), NO Move
            fireEvent.click(cell0)
            expect(makeMoveSpy).not.toHaveBeenCalled()

            // Second Click -> Place
            fireEvent.click(cell0)
            expect(makeMoveSpy).toHaveBeenCalledWith(expect.any(Number), expect.any(Number))
        })

        it("should allow SINGLE CLICK on Desktop", () => {
            // Simulate Desktop
            window.matchMedia = jest.fn().mockImplementation(query => ({
                matches: false, // Not mobile
                media: query,
                onchange: null,
                addListener: jest.fn(),
                removeListener: jest.fn(),
                addEventListener: jest.fn(),
                removeEventListener: jest.fn(),
                dispatchEvent: jest.fn(),
            }))

            render(
                <GameRulesProvider>
                    <BattleGround gameMode="player-vs-player" />
                </GameRulesProvider>
            )

            // Force resize just to be safe
            act(() => {
                window.dispatchEvent(new Event('resize'))
            })

            const cells = screen.getAllByRole("button")
            const cell0 = cells.find(c => c.className.includes("game-cell") || c.getAttribute('data-cell') !== null) || cells[10]

            // First Click -> Place Immediately
            fireEvent.click(cell0)
            expect(makeMoveSpy).toHaveBeenCalledWith(expect.any(Number), expect.any(Number))
        })
    })
})
