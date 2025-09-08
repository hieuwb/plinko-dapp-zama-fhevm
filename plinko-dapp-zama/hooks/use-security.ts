"use client"

import { useState, useEffect, useCallback } from "react"
import { SecurityManager, InputValidator, SignatureValidator } from "@/lib/security"
import { EIP712Signer } from "@/lib/eip712"
import { useToast } from "@/hooks/use-toast"

export function useSecurity() {
  const [securityManager] = useState(() => new SecurityManager())
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [authSession, setAuthSession] = useState<any>(null)
  const [gameResults, setGameResults] = useState<number[]>([])
  const { toast } = useToast()

  // Clean expired sessions periodically
  useEffect(() => {
    const interval = setInterval(() => {
      securityManager.cleanExpiredSessions()
    }, 60000) // Clean every minute

    return () => clearInterval(interval)
  }, [securityManager])

  // Authenticate user with EIP-712 signature
  const authenticateUser = useCallback(
    async (address: string, eip712Signer: EIP712Signer): Promise<boolean> => {
      try {
        // Validate address format
        if (!InputValidator.validateAddress(address)) {
          toast({
            title: "Invalid Address",
            description: "Please provide a valid Ethereum address",
            variant: "destructive",
          })
          return false
        }

        // Check if address is blocked
        const sessionValidation = securityManager.validateSession(address)
        if (!sessionValidation.valid && sessionValidation.reason === "Address is blocked") {
          toast({
            title: "Access Denied",
            description: "This address has been blocked due to suspicious activity",
            variant: "destructive",
          })
          return false
        }

        // Sign authentication message
        const { message, signature } = await eip712Signer.signAuthentication(address)

        // Validate signature components
        if (!SignatureValidator.validateSignatureAge(message.timestamp)) {
          toast({
            title: "Authentication Failed",
            description: "Signature is too old, please try again",
            variant: "destructive",
          })
          return false
        }

        if (!SignatureValidator.validateNonce(message.nonce)) {
          toast({
            title: "Authentication Failed",
            description: "Invalid nonce, please try again",
            variant: "destructive",
          })
          return false
        }

        // Verify signature
        const isValidSignature = EIP712Signer.verifySignature(message, signature, address)
        if (!isValidSignature) {
          toast({
            title: "Authentication Failed",
            description: "Invalid signature",
            variant: "destructive",
          })
          return false
        }

        // Create secure session
        const session = securityManager.createSession(address, signature, message.nonce)
        setAuthSession(session)
        setIsAuthenticated(true)

        toast({
          title: "Authentication Successful",
          description: "Secure session established",
        })

        return true
      } catch (error: any) {
        console.error("Authentication error:", error)
        toast({
          title: "Authentication Error",
          description: error.message || "Failed to authenticate",
          variant: "destructive",
        })
        return false
      }
    },
    [securityManager, toast],
  )

  // Validate game attempt
  const validateGameAttempt = useCallback(
    (address: string): { allowed: boolean; reason?: string } => {
      // Check session validity
      const sessionValidation = securityManager.validateSession(address)
      if (!sessionValidation.valid) {
        return sessionValidation
      }

      // Check rate limits
      const rateLimitCheck = securityManager.checkRateLimit(address)
      if (!rateLimitCheck.allowed) {
        toast({
          title: "Rate Limited",
          description: rateLimitCheck.reason || "Please wait before playing again",
          variant: "destructive",
        })
        return rateLimitCheck
      }

      return { allowed: true }
    },
    [securityManager, toast],
  )

  // Record game result with security checks
  const recordGameResult = useCallback(
    (address: string, multiplier: number, slot: number): boolean => {
      // Validate inputs
      if (!InputValidator.validateMultiplier(multiplier)) {
        toast({
          title: "Invalid Game Result",
          description: "Invalid multiplier value",
          variant: "destructive",
        })
        return false
      }

      if (!InputValidator.validateSlot(slot)) {
        toast({
          title: "Invalid Game Result",
          description: "Invalid slot value",
          variant: "destructive",
        })
        return false
      }

      // Record the game attempt
      securityManager.recordGameAttempt(address)

      // Update game results for anti-cheat analysis
      const newResults = [...gameResults, multiplier].slice(-50) // Keep last 50 results
      setGameResults(newResults)

      // Check for suspicious activity
      const isSuspicious = securityManager.detectSuspiciousActivity(address, newResults)
      if (isSuspicious) {
        toast({
          title: "Suspicious Activity Detected",
          description: "Your account is being reviewed for unusual patterns",
          variant: "destructive",
        })
        return false
      }

      return true
    },
    [securityManager, gameResults, toast],
  )

  // Logout and clear session
  const logout = useCallback(
    (address: string) => {
      setIsAuthenticated(false)
      setAuthSession(null)
      setGameResults([])

      toast({
        title: "Logged Out",
        description: "Session ended successfully",
      })
    },
    [toast],
  )

  return {
    securityManager,
    isAuthenticated,
    authSession,
    authenticateUser,
    validateGameAttempt,
    recordGameResult,
    logout,
  }
}
