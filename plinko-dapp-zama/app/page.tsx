"use client";

import { useState, useEffect } from "react";
import { Navigation } from "@/components/navigation";
import { ResponsiveCanvas } from "@/components/responsive-canvas";
import { Leaderboard } from "@/components/leaderboard";
import { GameStats } from "@/components/game-stats";
import { SecurityStatus } from "@/components/security-status";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Coins, TrendingUp, Smartphone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useContract } from "@/hooks/use-contract";

export default function PlinkoGame() {
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [gameResults, setGameResults] = useState<{ multiplier: number; slot: number; timestamp: number }[]>([]);
  const [playerStats, setPlayerStats] = useState({
    gamesPlayed: 0,
    totalWinnings: "0.00",
    bestMultiplier: 0,
    winRate: 0,
    averageMultiplier: 0,
  });

  const { toast } = useToast();
  const {
    isInitialized,
    isLoading,
    isAuthenticated,
    balance,
    securityManager,
    initializeContract,
    playGame,
    submitGameResult,
    getDecryptedBalance,
  } = useContract();

  // Sync with wallet connection
  const handleWalletConnected = async (address: string) => {
    setWalletAddress(address);
    try {
      await initializeContract(address);
    } catch (error) {
      console.error("Failed to initialize contract:", error);
      toast({
        title: "Initialization Failed",
        description: "Could not initialize contract. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleWalletDisconnected = () => {
    setWalletAddress("");
  };

  const updatePlayerStats = (multiplier: number) => {
    setPlayerStats((prev) => {
      const newGamesPlayed = prev.gamesPlayed + 1;
      const newBestMultiplier = Math.max(prev.bestMultiplier, multiplier);
      const wins = multiplier >= 1 ? 1 : 0;
      const newWinRate = (prev.winRate * prev.gamesPlayed + wins * 100) / newGamesPlayed;
      const newAverageMultiplier = (prev.averageMultiplier * prev.gamesPlayed + multiplier) / newGamesPlayed;
      const gameWinning = multiplier >= 1 ? 0.01 * multiplier : 0;
      const newTotalWinnings = (Number.parseFloat(prev.totalWinnings) + gameWinning).toFixed(4);
      return {
        gamesPlayed: newGamesPlayed,
        totalWinnings: newTotalWinnings,
        bestMultiplier: newBestMultiplier,
        winRate: Math.round(newWinRate),
        averageMultiplier: newAverageMultiplier,
      };
    });
  };

  const handleGameResult = async (multiplier: number, slot: number) => {
    const result = { multiplier, slot, timestamp: Date.now() };
    setGameResults((prev) => [result, ...prev.slice(0, 9)]);
    updatePlayerStats(multiplier);
    if (isInitialized) {
      const gameId = await playGame();
      if (gameId !== null) {
        await submitGameResult(gameId, multiplier, slot);
      }
    }
    toast({
      title: "Game Result",
      description: `Ball landed in slot ${slot + 1} with ${multiplier}x multiplier!`,
    });
  };

  const handlePlayGame = async (): Promise<number | null> => {
    if (!isInitialized) {
      toast({
        title: "Please Wait",
        description: "System is still initializing...",
        variant: "destructive",
      });
      return null;
    }
    return await playGame();
  };

  // Update balance periodically (useContract manages state internally)
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isInitialized && !isLoading) {
      interval = setInterval(async () => {
        await getDecryptedBalance();
      }, 5000);
      getDecryptedBalance(); // Initial update
    }
    return () => clearInterval(interval);
  }, [isInitialized, isLoading, getDecryptedBalance]);

  return (
    <div className="min-h-screen bg-background">
      <Navigation onWalletConnected={handleWalletConnected} onWalletDisconnected={handleWalletDisconnected} />
      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 sm:gap-6">
          {/* Game Area */}
          <div className="xl:col-span-3 order-1">
            <Card className="bg-card/50 border-border backdrop-blur-sm overflow-hidden">
              <CardHeader className="pb-3 sm:pb-6">
                <CardTitle className="text-lg sm:text-2xl font-bold text-foreground flex flex-col sm:flex-row sm:items-center gap-2">
                  <div className="flex items-center gap-2">
                    <Coins className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                    Plinko Game Board
                  </div>
                  {walletAddress && (
                    <div className="flex flex-wrap gap-1 sm:gap-2">
                      <span
                        className={`text-xs px-2 py-1 rounded-full transition-colors ${
                          isInitialized ? "bg-secondary/20 text-secondary" : "bg-muted/20 text-muted-foreground"
                        }`}
                      >
                        {isLoading ? (
                          <div className="flex items-center gap-1">
                            <LoadingSpinner size="sm" />
                            Initializing...
                          </div>
                        ) : isInitialized ? (
                          "Contract Ready"
                        ) : (
                          "Initializing..."
                        )}
                      </span>
                      <span
                        className={`text-xs px-2 py-1 rounded-full transition-colors ${
                          isAuthenticated ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"
                        }`}
                      >
                        {isAuthenticated ? "Authenticated" : "Authenticating..."}
                      </span>
                      <span className="text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-400">
                        Balance: {balance ? `${(balance / 1e18).toFixed(4)} ETH` : "Loading..."}
                      </span>
                    </div>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-6">
                <ResponsiveCanvas
                  onGameResult={handleGameResult}
                  isConnected={!!walletAddress && isInitialized}
                  onPlayGame={handlePlayGame}
                  isLoading={isLoading}
                />
              </CardContent>
            </Card>

            {gameResults.length > 0 && (
              <Card className="bg-card/50 border-border backdrop-blur-sm mt-4 sm:mt-6">
                <CardHeader className="pb-3 sm:pb-6">
                  <CardTitle className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-secondary" />
                    Your Recent Results
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-3">
                    {gameResults.map((result, index) => (
                      <div
                        key={result.timestamp}
                        className="text-center p-2 sm:p-3 rounded-lg bg-background/30 hover:bg-background/50 transition-all duration-300 hover:scale-105"
                        style={{ animation: `slideInFromRight 0.3s ease-out forwards ${index * 100}ms` }}
                      >
                        <div className="text-sm sm:text-lg font-bold text-secondary">{result.multiplier}x</div>
                        <div className="text-xs text-muted-foreground">Slot {result.slot + 1}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="xl:col-span-1 order-2 xl:order-2 space-y-4 sm:space-y-6">
            <div className="xl:hidden">
              <Card className="bg-card/50 border-border backdrop-blur-sm">
                <CardContent className="p-3">
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <Smartphone className="w-4 h-4" />
                    <span className="text-xs">Swipe up for more stats</span>
                  </div>
                </CardContent>
              </Card>
            </div>
            <SecurityStatus address={walletAddress} securityManager={securityManager} isConnected={!!walletAddress} />
            <Leaderboard entries={[]} currentPlayer={walletAddress} isLoading={isLoading} />
            <GameStats playerStats={walletAddress ? playerStats : undefined} isConnected={!!walletAddress} />
          </div>
        </div>
      </main>
    </div>
  );
}
