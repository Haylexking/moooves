// ============================================================================
// CORE GAME TYPES
// ============================================================================
export type Player = "X" | "O"
export type CellValue = Player | null
export type GameBoard = CellValue[][]
export type Position = [number, number]
export type Sequence = Position[]

// ============================================================================
// USER ROLES & PERMISSIONS
// ============================================================================
export type UserRole = "player" | "host" | "admin"

export interface User {
  id: string
  email: string
  fullName: string // Add fullName field
  phone?: string
  role: UserRole
  gamesPlayed: number
  canHost: boolean // Unlocked after 2 games
  emailVerified?: boolean // Add email verification status
  createdAt: number
  lastActive: number
}

export interface RegisterRequest {
  fullName: string
  email: string
  password: string
  repeatPassword: string // Backend expects repeatPassword
  phone?: string
}

export interface LoginRequest {
  email: string
  password: string
}

// ============================================================================
// TOURNAMENT SYSTEM
// ============================================================================
export type TournamentStatus = "created" | "waiting" | "active" | "completed" | "cancelled"
export type MatchStatus = "waiting" | "active" | "completed"
export type GameMode = "timed" | "full-grid"

export interface Tournament {
  id: string
  hostId: string
  name: string
  status: TournamentStatus
  inviteCode: string
  inviteLink: string

  // Entry & Prize Pool
  entryFee: number // Minimum ₦1,000
  minPlayers: number // 6
  maxPlayers: number // 50
  currentPlayers: number
  totalPool: number // Minimum ₦100,000

  // Tournament Settings
  gameMode: GameMode
  matchDuration: number // 10 minutes for tournaments

  // Participants & Results
  participants: TournamentParticipant[]
  bracket: TournamentBracket
  winners: TournamentWinner[]

  // Timestamps
  createdAt: number
  startedAt?: number
  completedAt?: number
}

export interface TournamentParticipant {
  userId: string
  email: string
  joinedAt: number
  paymentStatus: "pending" | "confirmed" | "failed"
  paymentId?: string
  eliminated: boolean
  eliminatedAt?: number
  finalRank?: number
}

export interface TournamentBracket {
  rounds: BracketRound[]
  currentRound: number
}

export interface BracketRound {
  roundNumber: number
  matches: BracketMatch[]
  status: "waiting" | "active" | "completed"
}

export interface BracketMatch {
  id: string
  tournamentId: string
  roundNumber: number
  player1Id: string
  player2Id: string
  winnerId?: string
  player1Score: number
  player2Score: number
  status: MatchStatus
  gameBoard?: GameBoard
  moveHistory: Move[]
  startedAt?: number
  completedAt?: number
}

export interface TournamentWinner {
  userId: string
  rank: number // 1st, 2nd, 3rd
  prize: number
  paidOut: boolean
  paidAt?: number
}

// ============================================================================
// GAME MECHANICS
// ============================================================================
export interface GameState {
  board: GameBoard
  currentPlayer: Player
  scores: Record<Player, number>
  gameStatus: "waiting" | "playing" | "paused" | "completed"
  usedSequences: Sequence[]
  moveHistory: Move[]
  gameStartTime: number
  timeLeft: number
}

export interface Move {
  player: Player
  position: Position
  timestamp: number
  sequencesScored: number
  row?: number
  col?: number
}

export interface GameResult {
  winnerId?: string
  player1Score: number
  player2Score: number
  isDraw: boolean
  totalMoves: number
  gameDuration: number
  completedAt: number
}

// ============================================================================
// PAYMENT SYSTEM
// ============================================================================
export type PaymentStatus = "pending" | "processing" | "confirmed" | "failed" | "refunded"
export type PaymentMethod = "card" | "bank_transfer"

export interface Payment {
  id: string
  userId: string
  tournamentId: string
  amount: number
  currency: "NGN"
  method: PaymentMethod
  status: PaymentStatus
  gatewayReference: string // Flutterwave/Paystack reference
  createdAt: number
  confirmedAt?: number
}

export interface Payout {
  id: string
  tournamentId: string
  recipientId: string
  recipientType: "host" | "winner" | "platform"
  amount: number
  percentage: number
  status: PaymentStatus
  gatewayReference?: string
  createdAt: number
  paidAt?: number
}

// ============================================================================
// INVITE SYSTEM
// ============================================================================
export interface Invite {
  id: string
  tournamentId: string
  hostId: string
  inviteCode: string
  inviteLink: string
  maxUses?: number
  currentUses: number
  expiresAt?: number
  createdAt: number
  isActive: boolean
}

export interface InviteUsage {
  id: string
  inviteId: string
  userId: string
  usedAt: number
  ipAddress: string
}

// ============================================================================
// ADMIN DASHBOARD
// ============================================================================
export interface AdminStats {
  totalUsers: number
  activeTournaments: number
  completedTournaments: number
  totalRevenue: number
  platformRevenue: number
  averagePoolSize: number
  topHosts: HostStats[]
  recentActivity: AdminActivity[]
}

export interface HostStats {
  userId: string
  email: string
  tournamentsHosted: number
  totalEarnings: number
  averagePoolSize: number
}

export interface AdminActivity {
  id: string
  type: "tournament_created" | "tournament_completed" | "payment_confirmed" | "user_registered"
  description: string
  userId?: string
  tournamentId?: string
  timestamp: number
}

// ============================================================================
// OFFLINE/CASUAL PLAY
// ============================================================================
export interface CasualGame {
  id: string
  player1Id: string
  player2Id: string
  connectionType: "bluetooth" | "wifi" | "local"
  gameMode: GameMode
  gameState: GameState
  createdAt: number
}

// ============================================================================
// SOCIAL SHARING
// ============================================================================
export interface SharePrompt {
  type: "host_payout" | "tournament_win"
  message: string
  platforms: ("twitter" | "facebook" | "whatsapp" | "instagram")[]
  metadata: {
    tournamentId: string
    earnings?: number
    rank?: number
  }
}

// ============================================================================
// API TYPES
// ============================================================================
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
  timestamp: number
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  limit: number
  hasNext: boolean
  hasPrev: boolean
}

// Tournament API
export interface CreateTournamentRequest {
  name: string
  entryFee: number
  maxPlayers: number
  gameMode: GameMode
}

export interface JoinTournamentRequest {
  inviteCode: string
  paymentMethod: PaymentMethod
}

export interface StartTournamentRequest {
  tournamentId: string
}

// Payment API
export interface InitiatePaymentRequest {
  tournamentId: string
  amount: number
  method: PaymentMethod
  redirectUrl: string
}

export interface PaymentWebhookPayload {
  event: string
  data: {
    id: string
    status: string
    reference: string
    amount: number
    customer: {
      email: string
    }
  }
}

// ============================================================================
// COMPONENT PROPS
// ============================================================================
export interface CellProps {
  value: CellValue
  onClick: () => void
  disabled?: boolean
  row: number
  col: number
  isHighlighted?: boolean
}

export interface GameHeaderProps {
  timeLeft: number
  showDebugInfo?: boolean
}

export interface GameResultsProps {
  onPlayAgain: () => void
  onBackToMenu: () => void
}

export interface GameBoardProps {
  disabled?: boolean
  showCoordinates?: boolean
}

export interface TournamentCardProps {
  tournament: Tournament
  userRole: UserRole
  onJoin?: (tournamentId: string) => void
  onManage?: (tournamentId: string) => void
}

export interface BracketViewProps {
  bracket: TournamentBracket
  currentUserId: string
  onMatchClick?: (match: BracketMatch) => void
}

export interface PaymentFormProps {
  tournament: Tournament
  onPaymentInitiated: (paymentId: string) => void
  onPaymentCompleted: (paymentId: string) => void
}

export interface AdminDashboardProps {
  stats: AdminStats
  onRefresh: () => void
}

// ============================================================================
// STORE TYPES
// ============================================================================
export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
}

export interface TournamentState {
  tournaments: Tournament[]
  currentTournament: Tournament | null
  userTournaments: Tournament[]
  isLoading: boolean
}

export interface GameStoreState {
  currentGame: GameState | null
  gameHistory: GameResult[]
  isPlaying: boolean
}

export interface PaymentState {
  payments: Payment[]
  currentPayment: Payment | null
  isProcessing: boolean
}

// ============================================================================
// CONFIGURATION
// ============================================================================
export interface AppConfig {
  minEntryFee: number // ₦1,000
  minPoolSize: number // ₦100,000
  minPlayers: number // 6
  maxPlayers: number // 50
  matchDuration: number // 10 minutes
  hostUnlockGames: number // 2 games
  payoutSplit: {
    host: number // 50%
    winners: {
      first: number // 20%
      second: number // 12%
      third: number // 8%
    }
    platform: number // 10%
  }
  paymentGateways: {
    flutterwave: {
      publicKey: string
      secretKey: string
    }
    paystack: {
      publicKey: string
      secretKey: string
    }
  }
}
