"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { AnimatedCounter } from "@/components/ui/animated-counter"
import { BarChart3, Coins, Target, Zap, TrendingUp } from "lucide-react"

interface GameStatsProps {
  totalGames?: number
  totalPayout?: string
  maxMultiplier?: number
  playerStats?: {
    gamesPlayed: number
    totalWinnings: string
    bestMultiplier: number
    winRate: number
    averageMultiplier: number
  }
  isConnected?: boolean
}

export function GameStats({
  totalGames = 1234,
  totalPayout = "45.67",
  maxMultiplier = 100,
  playerStats,
  isConnected,
}: GameStatsProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Global Stats */}
      <Card
        className={`bg-card/50 border-border backdrop-blur-sm transition-all duration-700 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
      >
        <CardHeader>
          <CardTitle className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            Global Stats
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 sm:space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Target className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
                <span className="text-xs sm:text-sm text-muted-foreground">Total Games</span>
              </div>
              <span className="text-sm sm:text-lg text-foreground font-mono">
                <AnimatedCounter value={totalGames} />
              </span>
            </div>

            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Coins className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
                <span className="text-xs sm:text-sm text-muted-foreground">Total Payout</span>
              </div>
              <span className="text-sm sm:text-lg text-foreground font-mono">
                <AnimatedCounter value={Number.parseFloat(totalPayout)} suffix=" ETH" />
              </span>
            </div>

            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Zap className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
                <span className="text-xs sm:text-sm text-muted-foreground">Max Multiplier</span>
              </div>
              <Badge variant="secondary" className="text-sm sm:text-lg font-mono">
                <AnimatedCounter value={maxMultiplier} suffix="x" />
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Player Stats */}
      {isConnected && playerStats && (
        <Card
          className={`bg-card/50 border-border backdrop-blur-sm transition-all duration-700 delay-200 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <CardHeader>
            <CardTitle className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-secondary" />
              Your Stats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 sm:space-y-4">
              <div className="grid grid-cols-2 gap-2 sm:gap-4">
                <div className="text-center p-2 sm:p-3 rounded-lg bg-background/30 hover:bg-background/50 transition-colors">
                  <div className="text-lg sm:text-2xl font-bold text-primary">
                    <AnimatedCounter value={playerStats.gamesPlayed} />
                  </div>
                  <div className="text-xs text-muted-foreground">Games Played</div>
                </div>

                <div className="text-center p-2 sm:p-3 rounded-lg bg-background/30 hover:bg-background/50 transition-colors">
                  <div className="text-lg sm:text-2xl font-bold text-secondary">
                    <AnimatedCounter value={playerStats.bestMultiplier} suffix="x" />
                  </div>
                  <div className="text-xs text-muted-foreground">Best Multiplier</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-muted-foreground">Win Rate</span>
                  <span className="text-foreground">{playerStats.winRate}%</span>
                </div>
                <Progress value={playerStats.winRate} className="h-1 sm:h-2" />
              </div>

              <div className="flex justify-between items-center">
                <span className="text-xs sm:text-sm text-muted-foreground">Total Winnings</span>
                <span className="text-xs sm:text-sm text-foreground font-mono">{playerStats.totalWinnings} ETH</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-xs sm:text-sm text-muted-foreground">Avg Multiplier</span>
                <span className="text-xs sm:text-sm text-secondary font-mono">
                  {playerStats.averageMultiplier.toFixed(1)}x
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Achievement Badges */}
      {isConnected && playerStats && playerStats.gamesPlayed > 0 && (
        <Card
          className={`bg-card/50 border-border backdrop-blur-sm transition-all duration-700 delay-400 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <CardHeader>
            <CardTitle className="text-base sm:text-lg font-bold text-foreground">Achievements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1 sm:gap-2">
              {playerStats.gamesPlayed >= 1 && (
                <Badge variant="secondary" className="text-xs animate-pulse">
                  🎯 First Drop
                </Badge>
              )}
              {playerStats.gamesPlayed >= 10 && (
                <Badge variant="secondary" className="text-xs animate-pulse">
                  🔥 Regular Player
                </Badge>
              )}
              {playerStats.bestMultiplier >= 50 && (
                <Badge variant="secondary" className="text-xs animate-pulse">
                  💎 High Roller
                </Badge>
              )}
              {playerStats.bestMultiplier >= 100 && (
                <Badge variant="secondary" className="text-xs animate-pulse">
                  👑 Jackpot Winner
                </Badge>
              )}
              {playerStats.winRate >= 70 && (
                <Badge variant="secondary" className="text-xs animate-pulse">
                  🎲 Lucky Streak
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
