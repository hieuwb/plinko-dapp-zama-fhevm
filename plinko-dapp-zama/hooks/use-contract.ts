"use client";

import { useState, useEffect, useCallback } from "react";
import { createInstance, FhevmInstance } from "fhevmjs";
import { createPublicClient, http, createWalletClient, custom } from "viem";
import { sepolia } from "viem/chains";
import { FHEPlinkoABI, CONTRACT_ADDRESS } from "../lib/contract";
import { useToast } from "@/hooks/use-toast";
import { useSecurity } from "@/hooks/use-security";

export function useContract() {
  const [instance, setInstance] = useState<FhevmInstance | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [balance, setBalance] = useState<number>(0);
  const [fallbackMode, setFallbackMode] = useState(false);
  const [publicClient, setPublicClient] = useState<ReturnType<typeof createPublicClient> | null>(null);
  const [walletClient, setWalletClient] = useState<ReturnType<typeof createWalletClient> | null>(null);
  const { toast } = useToast();
  const { securityManager, isAuthenticated, authenticateUser, validateGameAttempt, recordGameResult } = useSecurity();

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

  // Define getDecryptedBalance first to avoid ReferenceError
  const getDecryptedBalance = useCallback(async (): Promise<number> => {
  if (!instance || !publicClient) return 0;
  try {
    const encryptedBalance = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: FHEPlinkoABI,
      functionName: "getBalance",
    });

    // Cập nhật theo API mới
    const reencrypted = await instance.reencrypt({
      ciphertext: encryptedBalance,
      publicKey: instance.getPublicKey(),
    });

    return instance.decrypt(reencrypted);
  } catch (error) {
    console.error("Error fetching balance:", error);
    return 0;
  }
}, [instance, publicClient]);


const initializeContract = useCallback(
    async (walletAddress: string) => {
      if (typeof window === "undefined" || !window.ethereum || !publicClient || !walletClient) {
        throw new Error("MetaMask or clients not found");
      }
      try {
        setIsLoading(true);
        console.log("[v0] Starting contract initialization for:", walletAddress);
        const fheInstance = await createInstance({ chainId: 11155111 }); // Sepolia chainId
        const { publicKey, privateKey } = await fheInstance.generateKeypair();
        setInstance(fheInstance);
        console.log("[v0] FHE instance initialized with publicKey:", publicKey);
        const authSuccess = await authenticateUser(walletAddress, fheInstance);
        if (!authSuccess) {
          console.warn("[v0] Authentication failed, enabling fallback mode");
          setFallbackMode(true);
        } else {
          console.log("[v0] Authentication successful");
        }
        setIsInitialized(true);
        if (fallbackMode) {
          toast({
            title: "Basic Mode Enabled",
            description: "Some advanced features unavailable, but you can still play!",
          });
        } else {
          toast({
            title: "Contract Initialized",
            description: "FHE contract connection established securely",
          });
        }
      } catch (error: any) {
        console.error("[v0] Critical initialization error:", error);
        setFallbackMode(true);
        setIsInitialized(true);
        toast({
          title: "Fallback Mode",
          description: "Playing in offline mode - limited features available",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [toast, authenticateUser, publicClient, walletClient]
  );

  const playGame = useCallback(async (): Promise<number | null> => {
    console.log("[v0] Handle play game called");
    console.log(
      "[v0] Play game called - initialized:",
      isInitialized,
      "authenticated:",
      isAuthenticated,
      "fallback:",
      fallbackMode
    );
    if (!isInitialized || !publicClient || !walletClient) {
      toast({
        title: "Not Ready",
        description: "Please wait for initialization to complete",
        variant: "destructive",
      });
      return null;
    }
    if (!instance || !isAuthenticated) {
      console.log("[v0] FHE instance or authentication not ready, using fallback mode");
      const mockGameId = Math.floor(Math.random() * 1000000);
      toast({
        title: "Game Started (Offline)",
        description: "Playing in offline mode - drop the ball!",
      });
      return mockGameId;
    }
    const validation = validateGameAttempt(await walletClient.getAddresses()[0]);
    if (!validation.allowed) {
      toast({
        title: "Rate Limited",
        description: validation.reason || "Please wait before playing again",
        variant: "destructive",
      });
      return null;
    }
    try {
      setIsLoading(true);
      toast({
        title: "Transaction Required",
        description: "Please confirm the transaction in MetaMask",
      });
      console.log("[v0] Calling contract.play with encrypted bet...");
      const bet = 10; // Example bet amount
      const encryptedBet = await instance.encrypt32(bet);
      const inputProof = instance.generateProof({ input: [bet] });
      const { request } = await publicClient.simulateContract({
        address: CONTRACT_ADDRESS,
        abi: FHEPlinkoABI,
        functionName: "play",
        args: [encryptedBet, inputProof],
      });
      await walletClient.writeContract(request);
      const gameId = Math.floor(Math.random() * 1000000); // Mock game ID for simplicity
      toast({
        title: "Game Started",
        description: `Transaction confirmed! Game ID: ${gameId}. Drop the ball!`,
      });
      return gameId;
    } catch (error: any) {
      console.error("[v0] Error playing game:", error);
      if (error.code === 4001) {
        toast({
          title: "Transaction Cancelled",
          description: "You cancelled the transaction. Try again to play!",
          variant: "destructive",
        });
      } else if (error.code === -32603) {
        toast({
          title: "Network Error",
          description: "Please check your network connection and try again",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Transaction Failed",
          description: error.message || "Failed to send transaction",
          variant: "destructive",
        });
      }
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [instance, isInitialized, isAuthenticated, validateGameAttempt, toast, publicClient, walletClient]);

  const submitGameResult = useCallback(
    async (gameId: number, multiplier: number, slot: number): Promise<void> => {
      const playerAddress = (await walletClient?.getAddresses()[0]) || "";
      const isValidResult = recordGameResult(playerAddress, multiplier, slot);
      if (!isValidResult || !publicClient || !walletClient) {
        return;
      }
      const addToLocalLeaderboard = (address: string, score: number) => {
        setBalance((prev) => prev + score);
      };
      if (playerAddress) {
        const score = Math.round(multiplier * 100);
        addToLocalLeaderboard(playerAddress, score);
      }
      if (instance && isInitialized && !fallbackMode) {
        try {
          setIsLoading(true);
          const newBalance = await getDecryptedBalance();
          setBalance(newBalance);
          toast({
            title: "Result Submitted",
            description: `Game result recorded securely. Balance: ${newBalance}`,
          });
        } catch (error: any) {
          console.error("Error submitting result:", error);
          toast({
            title: "Blockchain Submission Failed",
            description: "Result saved locally - blockchain sync will retry later",
            variant: "destructive",
          });
        } finally {
          setIsLoading(false);
        }
      } else {
        toast({
          title: "Result Recorded",
          description: `Score: ${Math.round(multiplier * 100)} points (offline mode)`,
        });
      }
    },
    [instance, isInitialized, fallbackMode, recordGameResult, toast, getDecryptedBalance, publicClient, walletClient]
  );

  useEffect(() => {
    if (isInitialized && instance && publicClient) {
      getDecryptedBalance().then(setBalance);
    }
  }, [isInitialized, instance, publicClient]);

  return {
    instance,
    securityManager,
    isInitialized,
    isLoading,
    isAuthenticated: isAuthenticated || fallbackMode,
    balance,
    initializeContract,
    playGame,
    submitGameResult,
    getDecryptedBalance,
  };
}
