"use client"

import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trophy, Medal, Award, Clock, TrendingUp, Users, Crown } from "lucide-react"
import type { LeaderboardEntry } from "@/lib/contract"

interface LeaderboardProps {
  entries: LeaderboardEntry[]
  currentPlayer?: string
  isLoading?: boolean
}

type LeaderboardView = "top" | "recent" | "personal"

export function Leaderboard({ entries, currentPlayer, isLoading }: LeaderboardProps) {
  const [view, setView] = useState<LeaderboardView>("top")
  const [animatedEntries, setAnimatedEntries] = useState<LeaderboardEntry[]>([])

  // Animate entries when they change
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedEntries(entries)
    }, 100)
    return () => clearTimeout(timer)
  }, [entries])

  // Thêm CSS keyframes cho animation
  useEffect(() => {
    if (typeof document !== "undefined") {
      // Xóa style cũ nếu tồn tại để tránh duplicate
      const existingStyle = document.getElementById("fadeInUp-keyframes")
      if (existingStyle) {
        existingStyle.remove()
      }

      // Tạo style mới
      const style = document.createElement("style")
      style.id = "fadeInUp-keyframes"
      style.textContent = `
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `
      document.head.appendChild(style)

      // Cleanup khi component unmount
      return () => {
        if (style.parentNode) {
          style.parentNode.removeChild(style)
        }
      }
    }
  }, []) // Chỉ chạy một lần khi component mount

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-4 h-4 text-yellow-500" />
      case 2:
        return <Medal className="w-4 h-4 text-gray-400" />
      case 3:
        return <Award className="w-4 h-4 text-amber-600" />
      default:
        return <span className="text-sm font-mono text-muted-foreground">#{rank}</span>
    }
  }

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-yellow-500/20 border-yellow-500/50"
      case 2:
        return "bg-gray-400/20 border-gray-400/50"
      case 3:
        return "bg-amber-600/20 border-amber-600/50"
      default:
        return "bg-background/30 border-border"
    }
  }

  const getFilteredEntries = () => {
    switch (view) {
      case "top":
        return animatedEntries.sort((a, b) => b.score - a.score).slice(0, 10)
      case "recent":
        return animatedEntries.sort((a, b) => b.timestamp - a.timestamp).slice(0, 10)
      case "personal":
        return animatedEntries
          .filter((entry) => entry.player.toLowerCase() === currentPlayer?.toLowerCase())
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, 10)
      default:
        return animatedEntries.slice(0, 10)
    }
  }

  const formatTimestamp = (timestamp: number) => {
    const now = Date.now()
    const diff = now - timestamp
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (days > 0) return `${days}d ago`
    if (hours > 0) return `${hours}h ago`
    if (minutes > 0) return `${minutes}m ago`
    return "Just now"
  }

  const filteredEntries = getFilteredEntries()
  const playerRank =
    animatedEntries
      .sort((a, b) => b.score - a.score)
      .findIndex((entry) => entry.player.toLowerCase() === currentPlayer?.toLowerCase()) + 1

  const getPersonalEntries = () => {
    return animatedEntries
      .filter((entry) => entry.player.toLowerCase() === currentPlayer?.toLowerCase())
      .sort((a, b) => b.timestamp - a.timestamp)
  }

  const personalEntries = getPersonalEntries()
  const totalGames = personalEntries.length
  const bestScore = personalEntries.length > 0 ? Math.max(...personalEntries.map((e) => e.score)) : 0

  return (
    <Card className="bg-card/50 border-border backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-lg font-bold text-foreground flex items-center justify-between">
          <div className="flex items-center gap-2">
            {view === "personal" ? (
              <>
                <Trophy className="w-5 h-5 text-secondary" />
                Your Game History
              </>
            ) : (
              <>
                <Trophy className="w-5 h-5 text-secondary" />
                Leaderboard
              </>
            )}
          </div>
          {currentPlayer && playerRank > 0 && (
            <Badge variant="outline" className="text-xs">
              Your Rank: #{playerRank}
            </Badge>
          )}
          {view === "personal" && totalGames > 0 && (
            <Badge variant="outline" className="text-xs">
              {totalGames} Games
            </Badge>
          )}
        </CardTitle>

        {/* View Toggle Buttons */}
        <div className="flex gap-1 p-1 bg-background/50 rounded-lg">
          <Button
            variant={view === "top" ? "default" : "ghost"}
            size="sm"
            onClick={() => setView("top")}
            className="flex-1 text-xs"
          >
            <TrendingUp className="w-3 h-3 mr-1" />
            Top
          </Button>
          <Button
            variant={view === "recent" ? "default" : "ghost"}
            size="sm"
            onClick={() => setView("recent")}
            className="flex-1 text-xs"
          >
            <Clock className="w-3 h-3 mr-1" />
            Recent
          </Button>
          {currentPlayer && (
            <Button
              variant={view === "personal" ? "default" : "ghost"}
              size="sm"
              onClick={() => setView("personal")}
              className="flex-1 text-xs"
            >
              <Users className="w-3 h-3 mr-1" />
              You
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-2">
          {isLoading ? (
            // Loading skeleton
            Array.from({ length: view === "personal" ? 3 : 5 }).map((_, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-lg bg-background/30 animate-pulse"
              >
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-muted/50 rounded"></div>
                  <div className="w-20 h-3 bg-muted/50 rounded"></div>
                </div>
                <div className="w-12 h-3 bg-muted/50 rounded"></div>
              </div>
            ))
          ) : filteredEntries.length > 0 ? (
            filteredEntries.map((entry, index) => {
              const actualRank =
                view === "top"
                  ? index + 1
                  : animatedEntries.sort((a, b) => b.score - a.score).findIndex((e) => e.player === entry.player) + 1
              const isCurrentPlayer = entry.player.toLowerCase() === currentPlayer?.toLowerCase()

              return (
                <div
                  key={`${entry.player}-${entry.timestamp}`}
                  className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-300 hover:scale-[1.02] ${getRankColor(
                    actualRank,
                  )} ${isCurrentPlayer ? "ring-2 ring-primary/50" : ""}`}
                  style={{
                    animation: `fadeInUp 0.3s ease-out forwards ${index * 50}ms`,
                  }}
                >
                  <div className="flex items-center gap-3">
                    {view === "personal" ? (
                      <Clock className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <div className="flex items-center justify-center w-6 h-6">{getRankIcon(actualRank)}</div>
                    )}
                    <div className="flex flex-col">
                      <span
                        className={`text-sm font-mono ${isCurrentPlayer ? "text-primary font-bold" : "text-foreground"}`}
                      >
                        {entry.player.slice(0, 6)}...{entry.player.slice(-4)}
                      </span>
                      {view === "recent" && (
                        <span className="text-xs text-muted-foreground">{formatTimestamp(entry.timestamp)}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold ${actualRank <= 3 ? "text-secondary" : "text-foreground"}`}>
                      {entry.score}
                      {view === "top" && <span className="text-xs text-muted-foreground ml-1">pts</span>}
                    </span>
                    {isCurrentPlayer && (
                      <Badge variant="secondary" className="text-xs px-1 py-0">
                        You
                      </Badge>
                    )}
                    {view === "personal" && entry.score === bestScore && (
                      <Badge variant="secondary" className="text-xs px-1 py-0">
                        Best
                      </Badge>
                    )}
                  </div>
                </div>
              )
            })
          ) : (
            <div className="text-center py-8">
              <Trophy className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground text-sm">
                {view === "personal" ? "No games played yet. Drop a ball to start!" : "No entries yet"}
              </p>
            </div>
          )}
        </div>

        {/* Stats Summary */}
        {filteredEntries.length > 0 && view === "top" && (
          <div className="mt-4 pt-4 border-t border-border">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-lg font-bold text-secondary">
                  {Math.max(...filteredEntries.map((e) => e.score))}
                </div>
                <div className="text-xs text-muted-foreground">High Score</div>
              </div>
              <div>
                <div className="text-lg font-bold text-secondary">{filteredEntries.length}</div>
                <div className="text-xs text-muted-foreground">Players</div>
              </div>
            </div>
          </div>
        )}

        {view === "personal" && (
          <div className="mt-4 pt-4 border-t border-border">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-lg font-bold text-secondary">{bestScore}</div>
                <div className="text-xs text-muted-foreground">Best Score</div>
              </div>
              <div>
                <div className="text-lg font-bold text-secondary">{totalGames}</div>
                <div className="text-xs text-muted-foreground">Total Games</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
