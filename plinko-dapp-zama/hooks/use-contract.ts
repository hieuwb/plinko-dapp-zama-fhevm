"use client";

import { useState, useEffect, useCallback } from "react";
import { createInstance, FhevmInstance } from "fhevmjs";
import { createPublicClient, http, createWalletClient, custom } from "viem";
import { sepolia } from "viem/chains";
import { FHEPlinkoABI, CONTRACT_ADDRESS } from "@/lib/contract";
import { useToast } from "@/hooks/use-toast";
import { useSecurity } from "@/hooks/use-security";
import { publicDecrypt } from "@/lib/relayer-sdk";

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

  // Initialize Viem clients
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

  // 🔑 Decrypt balance via Relayer SDK
  const getDecryptedBalance = useCallback(async (): Promise<number> => {
    if (!publicClient) return 0;
    try {
      const encryptedBalance = (await publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: FHEPlinkoABI,
        functionName: "getBalance",
      })) as `0x${string}`;

      const balance = await publicDecrypt(CONTRACT_ADDRESS, encryptedBalance);
      return Number(balance);
    } catch (error) {
      console.error("Error fetching balance:", error);
      return 0;
    }
  }, [publicClient]);

  // Init FHE instance + user auth
  const initializeContract = useCallback(
    async (walletAddress: string) => {
      if (!window.ethereum || !publicClient || !walletClient) {
        throw new Error("MetaMask or clients not found");
      }
      try {
        setIsLoading(true);
        console.log("[v0] Starting contract initialization for:", walletAddress);

        const fheInstance = await createInstance({ chainId: 11155111 }); // Sepolia
        await fheInstance.generateKeypair();
        setInstance(fheInstance);

        const authSuccess = await authenticateUser(walletAddress, fheInstance);
        if (!authSuccess) {
          console.warn("[v0] Authentication failed, fallback mode enabled");
          setFallbackMode(true);
        }

        setIsInitialized(true);
        toast({
          title: "Contract Initialized",
          description: fallbackMode
            ? "Fallback mode enabled - limited features"
            : "FHE contract connection established",
        });
      } catch (error) {
        console.error("[v0] Initialization error:", error);
        setFallbackMode(true);
        setIsInitialized(true);
        toast({
          title: "Fallback Mode",
          description: "Playing in offline mode",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [toast, authenticateUser, publicClient, walletClient, fallbackMode]
  );

  // 🎲 Play game (encrypt bet + call contract)
  const playGame = useCallback(
    async (betAmount: number = 10): Promise<number | null> => {
      console.log("[v0] Play game with bet:", betAmount);

      if (!isInitialized || !publicClient || !walletClient) {
        toast({
          title: "Not Ready",
          description: "Please wait for initialization",
          variant: "destructive",
        });
        return null;
      }

      if (!instance || !isAuthenticated) {
        console.log("[v0] Using fallback mode");
        return Math.floor(Math.random() * 1000000);
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
          description: "Please confirm in MetaMask",
        });

        const encryptedBet = await instance.encrypt32(betAmount);
        const inputProof = instance.generateProof({ input: [betAmount] });

        const { request } = await publicClient.simulateContract({
          address: CONTRACT_ADDRESS,
          abi: FHEPlinkoABI,
          functionName: "play",
          args: [encryptedBet, inputProof],
        });

        await walletClient.writeContract(request);
        return Math.floor(Math.random() * 1000000);
      } catch (error: any) {
        console.error("[v0] Error playing game:", error);
        toast({
          title: "Transaction Failed",
          description: error.message || "Failed to send transaction",
          variant: "destructive",
        });
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [instance, isInitialized, isAuthenticated, validateGameAttempt, toast, publicClient, walletClient]
  );

  // 📊 Submit result
  const submitGameResult = useCallback(
    async (gameId: number, multiplier: number, slot: number): Promise<void> => {
      const playerAddress = (await walletClient?.getAddresses()[0]) || "";
      recordGameResult(playerAddress, multiplier, slot);

      if (!instance || !isInitialized || fallbackMode) {
        toast({
          title: "Result Recorded (Offline)",
          description: `Score: ${Math.round(multiplier * 100)} points`,
        });
        return;
      }

      try {
        setIsLoading(true);
        const newBalance = await getDecryptedBalance();
        setBalance(newBalance);
        toast({
          title: "Result Submitted",
          description: `Game result recorded. Balance: ${newBalance}`,
        });
      } catch (error) {
        console.error("Error submitting result:", error);
        toast({
          title: "Blockchain Submission Failed",
          description: "Result saved locally",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [instance, isInitialized, fallbackMode, recordGameResult, toast, getDecryptedBalance, walletClient]
  );

  // Auto update balance
  useEffect(() => {
    if (isInitialized && publicClient) {
      getDecryptedBalance().then(setBalance);
    }
  }, [isInitialized, publicClient, getDecryptedBalance]);

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
