"use client"

import { useRef, useEffect, useState } from "react"
import { PlinkoCanvas } from "./plinko-canvas"
import { Button } from "@/components/ui/button"
import { Maximize2, Minimize2 } from "lucide-react"

interface ResponsiveCanvasProps {
  onGameResult?: (multiplier: number, slot: number) => void
  isConnected: boolean
  onPlayGame?: () => Promise<number | null>
  isLoading?: boolean
}

export function ResponsiveCanvas({ onGameResult, isConnected, onPlayGame, isLoading }: ResponsiveCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [containerSize, setContainerSize] = useState({ width: 800, height: 600 })

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        const maxWidth = Math.min(rect.width - 32, 800) // 16px padding on each side
        const maxHeight = Math.min(window.innerHeight * 0.7, 600)

        setContainerSize({
          width: maxWidth,
          height: (maxWidth * 3) / 4, // Maintain 4:3 aspect ratio
        })
      }
    }

    updateSize()
    window.addEventListener("resize", updateSize)
    return () => window.removeEventListener("resize", updateSize)
  }, [])

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange)
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange)
  }, [])

  return (
    <div ref={containerRef} className={`relative ${isFullscreen ? "bg-background p-4" : ""}`}>
      {/* Fullscreen Toggle Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleFullscreen}
        className="absolute top-2 right-2 z-10 bg-background/80 backdrop-blur-sm hover:bg-background/90"
      >
        {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
      </Button>

      <div className="w-full overflow-hidden rounded-lg">
        <PlinkoCanvas
          onGameResult={onGameResult}
          isConnected={isConnected}
          isLoading={isLoading}
        />
      </div>
    </div>
  )
}
