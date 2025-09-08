"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { WalletConnection } from "./wallet-connection"
import { Menu, X } from "lucide-react"

interface MobileNavigationProps {
  onWalletConnected?: (address: string) => void
  onWalletDisconnected?: () => void
}

export function MobileNavigation({ onWalletConnected, onWalletDisconnected }: MobileNavigationProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="md:hidden">
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="sm">
            <Menu className="w-5 h-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-80 bg-background/95 backdrop-blur-sm">
          <div className="flex flex-col gap-6 pt-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground">Menu</h2>
              <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <WalletConnection onWalletConnected={onWalletConnected} onWalletDisconnected={onWalletDisconnected} />

              <div className="pt-4 border-t border-border">
                <nav className="space-y-2">
                  <Button variant="ghost" className="w-full justify-start">
                    Game Rules
                  </Button>
                  <Button variant="ghost" className="w-full justify-start">
                    Leaderboard
                  </Button>
                  <Button variant="ghost" className="w-full justify-start">
                    Statistics
                  </Button>
                </nav>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
