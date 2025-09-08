import { ethers } from "ethers"

// Security configuration
export const SECURITY_CONFIG = {
  MAX_GAMES_PER_MINUTE: 5,
  MAX_GAMES_PER_HOUR: 50,
  SESSION_TIMEOUT: 3600000, // 1 hour in milliseconds
  MIN_TIME_BETWEEN_GAMES: 2000, // 2 seconds
  MAX_SIGNATURE_AGE: 300000, // 5 minutes
  RATE_LIMIT_WINDOW: 60000, // 1 minute
}

export interface SecuritySession {
  address: string
  signature: string
  timestamp: number
  nonce: string
  gameCount: number
  lastGameTime: number
  rateLimitData: {
    games: number[]
    lastReset: number
  }
}

export class SecurityManager {
  private sessions = new Map<string, SecuritySession>()
  private blockedAddresses = new Set<string>()

  // Rate limiting
  checkRateLimit(address: string): { allowed: boolean; reason?: string } {
    const session = this.sessions.get(address.toLowerCase())
    if (!session) {
      return { allowed: false, reason: "No active session" }
    }

    const now = Date.now()

    // Clean old game timestamps
    session.rateLimitData.games = session.rateLimitData.games.filter(
      (timestamp) => now - timestamp < SECURITY_CONFIG.RATE_LIMIT_WINDOW,
    )

    // Check games per minute
    if (session.rateLimitData.games.length >= SECURITY_CONFIG.MAX_GAMES_PER_MINUTE) {
      return { allowed: false, reason: "Too many games per minute" }
    }

    // Check minimum time between games
    if (now - session.lastGameTime < SECURITY_CONFIG.MIN_TIME_BETWEEN_GAMES) {
      return { allowed: false, reason: "Please wait before playing again" }
    }

    return { allowed: true }
  }

  // Record game attempt
  recordGameAttempt(address: string): void {
    const session = this.sessions.get(address.toLowerCase())
    if (!session) return

    const now = Date.now()
    session.rateLimitData.games.push(now)
    session.lastGameTime = now
    session.gameCount++
  }

  // Session management
  createSession(address: string, signature: string, nonce: string): SecuritySession {
    const session: SecuritySession = {
      address: address.toLowerCase(),
      signature,
      timestamp: Date.now(),
      nonce,
      gameCount: 0,
      lastGameTime: 0,
      rateLimitData: {
        games: [],
        lastReset: Date.now(),
      },
    }

    this.sessions.set(address.toLowerCase(), session)
    return session
  }

  // Validate session
  validateSession(address: string): { valid: boolean; reason?: string } {
    if (this.blockedAddresses.has(address.toLowerCase())) {
      return { valid: false, reason: "Address is blocked" }
    }

    const session = this.sessions.get(address.toLowerCase())
    if (!session) {
      return { valid: false, reason: "No active session" }
    }

    const now = Date.now()
    if (now - session.timestamp > SECURITY_CONFIG.SESSION_TIMEOUT) {
      this.sessions.delete(address.toLowerCase())
      return { valid: false, reason: "Session expired" }
    }

    return { valid: true }
  }

  // Anti-cheat measures
  detectSuspiciousActivity(address: string, gameResults: number[]): boolean {
    if (gameResults.length < 5) return false

    // Check for impossible win rates
    const wins = gameResults.filter((result) => result >= 2).length
    const winRate = wins / gameResults.length
    if (winRate > 0.8 && gameResults.length > 10) {
      this.flagSuspiciousAddress(address, "Impossible win rate")
      return true
    }

    // Check for pattern manipulation
    const recentResults = gameResults.slice(-10)
    const uniqueResults = new Set(recentResults).size
    if (uniqueResults < 3 && recentResults.length >= 10) {
      this.flagSuspiciousAddress(address, "Pattern manipulation detected")
      return true
    }

    return false
  }

  // Flag suspicious addresses
  private flagSuspiciousAddress(address: string, reason: string): void {
    console.warn(`Suspicious activity detected for ${address}: ${reason}`)
    // In production, this would log to a security monitoring system
  }

  // Block address
  blockAddress(address: string, reason: string): void {
    this.blockedAddresses.add(address.toLowerCase())
    this.sessions.delete(address.toLowerCase())
    console.warn(`Address blocked: ${address} - ${reason}`)
  }

  // Clean expired sessions
  cleanExpiredSessions(): void {
    const now = Date.now()
    for (const [address, session] of this.sessions.entries()) {
      if (now - session.timestamp > SECURITY_CONFIG.SESSION_TIMEOUT) {
        this.sessions.delete(address)
      }
    }
  }

  // Get session info
  getSessionInfo(address: string): SecuritySession | null {
    return this.sessions.get(address.toLowerCase()) || null
  }
}

// Input validation utilities
export class InputValidator {
  static validateAddress(address: string): boolean {
    try {
      return ethers.isAddress(address)
    } catch {
      return false
    }
  }

  static validateMultiplier(multiplier: number): boolean {
    return Number.isFinite(multiplier) && multiplier >= 0 && multiplier <= 1000
  }

  static validateSlot(slot: number): boolean {
    return Number.isInteger(slot) && slot >= 0 && slot < 15
  }

  static validateGameId(gameId: number): boolean {
    return Number.isInteger(gameId) && gameId > 0
  }

  static sanitizeString(input: string): string {
    return input.replace(/[<>"'&]/g, "")
  }
}

// Signature validation with enhanced security
export class SignatureValidator {
  private static usedNonces = new Set<string>()

  static validateSignatureAge(timestamp: number): boolean {
    const now = Math.floor(Date.now() / 1000)
    return now - timestamp <= SECURITY_CONFIG.MAX_SIGNATURE_AGE / 1000
  }

  static validateNonce(nonce: string): boolean {
    if (this.usedNonces.has(nonce)) {
      return false
    }
    this.usedNonces.add(nonce)

    // Clean old nonces periodically
    if (this.usedNonces.size > 10000) {
      this.usedNonces.clear()
    }

    return true
  }

  static validateChainId(chainId: number): boolean {
    return chainId === 11155111 // Sepolia testnet
  }
}
