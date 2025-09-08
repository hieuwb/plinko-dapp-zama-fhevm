"use client"

import { WalletConnection } from "./wallet-connection"
import { MobileNavigation } from "./mobile-navigation"

interface NavigationProps {
  onWalletConnected?: (address: string) => void
  onWalletDisconnected?: () => void
}

export function Navigation({ onWalletConnected, onWalletDisconnected }: NavigationProps) {
  return (
    <nav className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-sm border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-foreground text-glow">
              Plinko <span className="text-primary">dApp</span>
            </h1>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-4">
            <WalletConnection onWalletConnected={onWalletConnected} onWalletDisconnected={onWalletDisconnected} />
          </div>

          {/* Mobile Navigation */}
          <MobileNavigation onWalletConnected={onWalletConnected} onWalletDisconnected={onWalletDisconnected} />
        </div>
      </div>
    </nav>
  )
}
