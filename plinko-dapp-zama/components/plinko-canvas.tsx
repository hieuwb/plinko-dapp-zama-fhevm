"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Play, RotateCcw } from "lucide-react";
import { useContract } from "@/hooks/use-contract";

interface PlinkoCanvasProps {
  onGameResult?: (multiplier: number, slot: number) => void;
  isConnected: boolean;
  isLoading?: boolean;
}

interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  trail: { x: number; y: number }[];
}

interface Peg {
  x: number;
  y: number;
  radius: number;
}

interface Slot {
  x: number;
  width: number;
  multiplier: number;
  color: string;
}

export function PlinkoCanvas({ onGameResult, isConnected, isLoading }: PlinkoCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const ballRef = useRef<Ball | null>(null);
  const [ball, setBall] = useState<Ball | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [pegs, setPegs] = useState<Peg[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [currentGameId, setCurrentGameId] = useState<number | null>(null);
  const [balance, setBalance] = useState<number>(0);

  // dùng trực tiếp playGame từ hook
  const { playGame, getDecryptedBalance } = useContract();

  // Canvas dimensions
  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 600;
  const GRAVITY = 0.3;
  const BOUNCE_DAMPING = 0.7;
  const FRICTION = 0.99;

  // Initialize pegs and slots
  useEffect(() => {
    const newPegs: Peg[] = [];
    const newSlots: Slot[] = [];

    const rows = 12;
    const pegRadius = 4;
    const rowSpacing = 45;
    const pegSpacing = 50;

    for (let row = 0; row < rows; row++) {
      const pegsInRow = row + 3;
      const rowWidth = (pegsInRow - 1) * pegSpacing;
      const startX = (CANVAS_WIDTH - rowWidth) / 2;

      for (let col = 0; col < pegsInRow; col++) {
        newPegs.push({
          x: startX + col * pegSpacing,
          y: 100 + row * rowSpacing,
          radius: pegRadius,
        });
      }
    }

    const slotCount = 15;
    const slotWidth = CANVAS_WIDTH / slotCount;
    const multipliers = [100, 50, 25, 10, 5, 2, 1.5, 1, 1.5, 2, 5, 10, 25, 50, 100];
    const colors = [
      "#dc2626",
      "#ea580c",
      "#d97706",
      "#ca8a04",
      "#65a30d",
      "#16a34a",
      "#059669",
      "#0891b2",
      "#0284c7",
      "#2563eb",
      "#4f46e5",
      "#7c3aed",
      "#9333ea",
      "#c026d3",
      "#dc2626",
    ];

    for (let i = 0; i < slotCount; i++) {
      newSlots.push({
        x: i * slotWidth,
        width: slotWidth,
        multiplier: multipliers[i],
        color: colors[i],
      });
    }

    setPegs(newPegs);
    setSlots(newSlots);
  }, []);

  useEffect(() => {
    ballRef.current = ball;
  }, [ball]);

  // Animation loop
  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#1f2937";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    slots.forEach((slot) => {
      const gradient = ctx.createLinearGradient(slot.x, CANVAS_HEIGHT - 60, slot.x, CANVAS_HEIGHT);
      gradient.addColorStop(0, slot.color + "40");
      gradient.addColorStop(1, slot.color + "80");

      ctx.fillStyle = gradient;
      ctx.fillRect(slot.x, CANVAS_HEIGHT - 60, slot.width, 60);

      ctx.strokeStyle = slot.color;
      ctx.lineWidth = 2;
      ctx.strokeRect(slot.x, CANVAS_HEIGHT - 60, slot.width, 60);

      ctx.fillStyle = "#ffffff";
      ctx.font = "12px monospace";
      ctx.textAlign = "center";
      ctx.fillText(`${slot.multiplier}x`, slot.x + slot.width / 2, CANVAS_HEIGHT - 35);
    });

    pegs.forEach((peg) => {
      ctx.shadowColor = "#8b5cf6";
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(peg.x, peg.y, peg.radius, 0, Math.PI * 2);
      ctx.fillStyle = "#8b5cf6";
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.beginPath();
      ctx.arc(peg.x, peg.y, peg.radius - 1, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
    });

    const currentBall = ballRef.current;
    if (currentBall) {
      const newBall = { ...currentBall };
      newBall.vy += GRAVITY;
      newBall.vx *= FRICTION;
      newBall.vy *= FRICTION;
      newBall.x += newBall.vx;
      newBall.y += newBall.vy;

      pegs.forEach((peg) => {
        const dx = newBall.x - peg.x;
        const dy = newBall.y - peg.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < newBall.radius + peg.radius) {
          const angle = Math.atan2(dy, dx);
          const targetX = peg.x + Math.cos(angle) * (peg.radius + newBall.radius);
          const targetY = peg.y + Math.sin(angle) * (peg.radius + newBall.radius);

          newBall.x = targetX;
          newBall.y = targetY;

          const bounceAngle = angle + (Math.random() - 0.5) * 0.5;
          const speed = Math.sqrt(newBall.vx * newBall.vx + newBall.vy * newBall.vy) * BOUNCE_DAMPING;
          newBall.vx = Math.cos(bounceAngle) * speed;
          newBall.vy = Math.sin(bounceAngle) * speed;
        }
      });

      if (newBall.x - newBall.radius < 0) {
        newBall.x = newBall.radius;
        newBall.vx = -newBall.vx * BOUNCE_DAMPING;
      }
      if (newBall.x + newBall.radius > CANVAS_WIDTH) {
        newBall.x = CANVAS_WIDTH - newBall.radius;
        newBall.vx = -newBall.vx * BOUNCE_DAMPING;
      }

      newBall.trail.push({ x: newBall.x, y: newBall.y });
      if (newBall.trail.length > 20) {
        newBall.trail.shift();
      }

      if (newBall.y > CANVAS_HEIGHT - 80) {
        const slotIndex = Math.floor(newBall.x / (CANVAS_WIDTH / slots.length));
        const clampedIndex = Math.max(0, Math.min(slots.length - 1, slotIndex));
        const landedSlot = slots[clampedIndex];

        onGameResult?.(landedSlot.multiplier, clampedIndex);
        setBall(null);
        setIsPlaying(false);
        setCurrentGameId(null);
        return;
      }

      newBall.trail.forEach((point, index) => {
        const alpha = index / newBall.trail.length;
        ctx.globalAlpha = alpha * 0.5;
        ctx.beginPath();
        ctx.arc(point.x, point.y, newBall.radius * alpha, 0, Math.PI * 2);
        ctx.fillStyle = newBall.color;
        ctx.fill();
      });
      ctx.globalAlpha = 1;

      ctx.shadowColor = "#00ffcc";
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(newBall.x, newBall.y, newBall.radius, 0, Math.PI * 2);
      ctx.fillStyle = newBall.color;
      ctx.fill();
      ctx.shadowBlur = 0;

      setBall(newBall);
    }

    animationRef.current = requestAnimationFrame(animate);
  }, [pegs, slots, onGameResult]);

  useEffect(() => {
    const startAnimation = () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      animate();
    };

    startAnimation();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  useEffect(() => {
    if (pegs.length > 0 && slots.length > 0) {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      animate();
    }
  }, [animate]);

  const dropBall = async () => {
    if (!isConnected || isPlaying || isLoading) return;
    console.log("[v0] Drop ball clicked - connected:", isConnected, "playing:", isPlaying, "loading:", isLoading);

    try {
      await playGame(); // không truyền tham số
      console.log("[v0] Game started successfully");

      const newBall: Ball = {
        x: CANVAS_WIDTH / 2 + (Math.random() - 0.5) * 50,
        y: 20,
        vx: (Math.random() - 0.5) * 2,
        vy: 0,
        radius: 8,
        color: "#00ffcc",
        trail: [],
      };

      setBall(newBall);
      setIsPlaying(true);
    } catch (error) {
      console.error("[v0] Error starting game:", error);
    }
  };

  const resetGame = () => {
    setBall(null);
    setIsPlaying(false);
    setCurrentGameId(null);
  };

  useEffect(() => {
    const updateBalance = async () => {
      const newBalance = await getDecryptedBalance();
      if (newBalance !== undefined) setBalance(newBalance);
    };

    if (isConnected && !isPlaying) {
      const interval = setInterval(updateBalance, 5000);
      updateBalance();
      return () => clearInterval(interval);
    }
  }, [isConnected, isPlaying, getDecryptedBalance]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="border border-border rounded-lg bg-background/50 backdrop-blur-sm"
          style={{ maxWidth: "100%", height: "auto" }}
        />

        {!isConnected && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm rounded-lg flex items-center justify-center">
            <div className="text-center">
              <p className="text-muted-foreground mb-2">Connect your wallet to play</p>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 w-full max-w-md">
        <div className="flex gap-3">
          <Button
            onClick={dropBall}
            disabled={!isConnected || isPlaying || isLoading}
            className="bg-primary hover:bg-primary/90 text-primary-foreground glow-purple w-full"
          >
            <Play className="w-4 h-4 mr-2" />
            {isPlaying ? "Ball Dropping..." : "Drop Ball"}
          </Button>

          <Button
            onClick={resetGame}
            variant="outline"
            disabled={!ball}
            className="border-border hover:bg-accent bg-transparent w-full"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
        </div>
        <div className="text-center text-white mt-2">
          Balance: {balance ? `${balance / 1e18} ETH` : "Loading..."}
        </div>
      </div>
    </div>
  );
}
