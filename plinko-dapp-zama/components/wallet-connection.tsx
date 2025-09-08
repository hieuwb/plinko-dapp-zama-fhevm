"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Wallet, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createPublicClient, http, createWalletClient, custom } from "viem";
import { sepolia } from "viem/chains";

interface WalletConnectionProps {
  onWalletConnected?: (address: string) => void;
  onWalletDisconnected?: () => void;
}

export function WalletConnection({ onWalletConnected, onWalletDisconnected }: WalletConnectionProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();
  const [publicClient, setPublicClient] = useState<ReturnType<typeof createPublicClient> | null>(null);
  const [walletClient, setWalletClient] = useState<ReturnType<typeof createWalletClient> | null>(null);

  // Initialize clients only on client-side
  useEffect(() => {
    if (typeof window !== "undefined" && window.ethereum) {
      const pubClient = createPublicClient({
        chain: sepolia,
        transport: http(process.env.SEPOLIA_RPC_URL || "https://sepolia.infura.io/v3/"),
      });
      const walClient = createWalletClient({
        chain: sepolia,
        transport: custom(window.ethereum as any),
      });
      setPublicClient(pubClient);
      setWalletClient(walClient);
    }
  }, []);

  // Check if wallet is already connected on component mount
  useEffect(() => {
    if (publicClient && walletClient) {
      checkWalletConnection();
    }
  }, [publicClient, walletClient]);

  const checkWalletConnection = async () => {
    if (walletClient) {
      try {
        const accounts = await walletClient.requestAddresses();
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
          setIsConnected(true);
          onWalletConnected?.(accounts[0]);
        }
      } catch (error) {
        console.error("Error checking wallet connection:", error);
      }
    }
  };

  const connectWallet = async () => {
    if (!walletClient || typeof window === "undefined" || !window.ethereum) {
      toast({
        title: "MetaMask Not Found",
        description: "Please install MetaMask to connect your wallet.",
        variant: "destructive",
      });
      return;
    }
    setIsConnecting(true);
    try {
      const accounts = await walletClient.requestAddresses();
      if (accounts.length > 0) {
        try {
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: "0xaa36a7" }],
          });
        } catch (switchError: any) {
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [
                {
                  chainId: "0xaa36a7",
                  chainName: "Sepolia Test Network",
                  nativeCurrency: {
                    name: "ETH",
                    symbol: "ETH",
                    decimals: 18,
                  },
                  rpcUrls: [process.env.SEPOLIA_RPC_URL || "https://sepolia.infura.io/v3/"],
                  blockExplorerUrls: ["https://sepolia.etherscan.io/"],
                },
              ],
            });
          }
        }
        setWalletAddress(accounts[0]);
        setIsConnected(true);
        onWalletConnected?.(accounts[0]);
        toast({
          title: "Wallet Connected",
          description: `Connected to ${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`,
        });
      }
    } catch (error: any) {
      console.error("Error connecting wallet:", error);
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect wallet",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setIsConnected(false);
    setWalletAddress("");
    onWalletDisconnected?.();
    toast({
      title: "Wallet Disconnected",
      description: "Your wallet has been disconnected",
    });
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (isConnected) {
    return (
      <Card className="bg-card/50 border-border backdrop-blur-sm">
        <div className="flex items-center gap-3 p-3">
          <div className="w-2 h-2 bg-secondary rounded-full glow-teal"></div>
          <span className="text-sm font-mono text-foreground">{formatAddress(walletAddress)}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={disconnectWallet}
            className="text-muted-foreground hover:text-destructive"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </Card>
    );
  }
  return (
    <Button
      onClick={connectWallet}
      disabled={isConnecting}
      className="bg-primary hover:bg-primary/90 text-primary-foreground glow-purple"
    >
      <Wallet className="w-4 h-4 mr-2" />
      {isConnecting ? "Connecting..." : "Connect Wallet"}
    </Button>
  );
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    ethereum?: any;
  }
}
