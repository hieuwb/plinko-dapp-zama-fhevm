"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Shield, AlertTriangle, CheckCircle, Clock, Zap } from "lucide-react"
import { type SecurityManager, SECURITY_CONFIG } from "@/lib/security"

interface SecurityStatusProps {
  address?: string
  securityManager?: SecurityManager
  isConnected: boolean
}

export function SecurityStatus({ address, securityManager, isConnected }: SecurityStatusProps) {
  const [sessionInfo, setSessionInfo] = useState<any>(null)
  const [securityLevel, setSecurityLevel] = useState<"high" | "medium" | "low">("high")
  const [rateLimitStatus, setRateLimitStatus] = useState({ games: 0, maxGames: SECURITY_CONFIG.MAX_GAMES_PER_MINUTE })

  useEffect(() => {
    if (!address || !securityManager || !isConnected) return

    const updateStatus = () => {
      const session = securityManager.getSessionInfo(address)
      setSessionInfo(session)

      if (session) {
        const now = Date.now()
        const recentGames = session.rateLimitData.games.filter(
          (timestamp) => now - timestamp < SECURITY_CONFIG.RATE_LIMIT_WINDOW,
        ).length

        setRateLimitStatus({
          games: recentGames,
          maxGames: SECURITY_CONFIG.MAX_GAMES_PER_MINUTE,
        })

        // Determine security level
        const sessionAge = now - session.timestamp
        const gameRate = session.gameCount / (sessionAge / 60000) // games per minute

        if (sessionAge < 300000 && gameRate < 2) {
          // New session, low activity
          setSecurityLevel("high")
        } else if (gameRate < 4) {
          setSecurityLevel("medium")
        } else {
          setSecurityLevel("low")
        }
      }
    }

    updateStatus()
    const interval = setInterval(updateStatus, 5000) // Update every 5 seconds

    return () => clearInterval(interval)
  }, [address, securityManager, isConnected])

  if (!isConnected) {
    return (
      <Card className="bg-card/50 border-border backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
            <Shield className="w-4 h-4 text-muted-foreground" />
            Security Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <Shield className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Connect wallet to view security status</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const getSecurityBadge = () => {
    switch (securityLevel) {
      case "high":
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/50">High Security</Badge>
      case "medium":
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50">Medium Security</Badge>
      case "low":
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/50">Low Security</Badge>
    }
  }

  const getSecurityIcon = () => {
    switch (securityLevel) {
      case "high":
        return <CheckCircle className="w-4 h-4 text-green-400" />
      case "medium":
        return <AlertTriangle className="w-4 h-4 text-yellow-400" />
      case "low":
        return <AlertTriangle className="w-4 h-4 text-red-400" />
    }
  }

  const rateLimitPercentage = (rateLimitStatus.games / rateLimitStatus.maxGames) * 100

  return (
    <Card className="bg-card/50 border-border backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-sm font-bold text-foreground flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            Security Status
          </div>
          {getSecurityBadge()}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Session Info */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getSecurityIcon()}
            <span className="text-xs text-muted-foreground">Session</span>
          </div>
          <span className="text-xs text-foreground">{sessionInfo ? "Active" : "Inactive"}</span>
        </div>

        {/* Rate Limit Status */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-3 h-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Rate Limit</span>
            </div>
            <span className="text-xs text-foreground">
              {rateLimitStatus.games}/{rateLimitStatus.maxGames}
            </span>
          </div>
          <Progress value={rateLimitPercentage} className="h-1" />
        </div>

        {/* Session Duration */}
        {sessionInfo && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-3 h-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Session Age</span>
            </div>
            <span className="text-xs text-foreground">{Math.floor((Date.now() - sessionInfo.timestamp) / 60000)}m</span>
          </div>
        )}

        {/* Games Played */}
        {sessionInfo && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Games Played</span>
            <span className="text-xs text-foreground">{sessionInfo.gameCount}</span>
          </div>
        )}

        {/* Security Tips */}
        <div className="pt-2 border-t border-border">
          <p className="text-xs text-muted-foreground">
            {securityLevel === "high" && "Your session is secure. Keep playing safely!"}
            {securityLevel === "medium" && "Moderate activity detected. Play responsibly."}
            {securityLevel === "low" && "High activity detected. Take breaks between games."}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
