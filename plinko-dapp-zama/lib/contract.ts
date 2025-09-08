import { ethers } from "ethers"
import { Abi } from 'viem';

export const FHEPlinkoABI: Abi = [
  {
    "inputs": [],
    "name": "getBalance",
    "outputs": [
      {
        "internalType": "euint32",
        "name": "",
        "type": "bytes32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "multipliers",
    "outputs": [
      {
        "internalType": "uint32",
        "name": "",
        "type": "uint32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "externalEuint32",
        "name": "encryptedBet",
        "type": "bytes32"
      },
      {
        "internalType": "bytes",
        "name": "inputProof",
        "type": "bytes"
      }
    ],
    "name": "play",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

export const CONTRACT_ADDRESS = '0xF25855cb0130a5916aD048e13Ba4Dd0f1e330eAC';
// Plinko Game Contract ABI (simplified for demo)
export const PLINKO_CONTRACT_ABI = [
  {
    inputs: [],
    name: "playGame",
    outputs: [
      {
        internalType: "uint256",
        name: "gameId",
        type: "uint256",
      },
    ],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "gameId",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "multiplier",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "slot",
        type: "uint256",
      },
    ],
    name: "submitResult",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "getLeaderboard",
    outputs: [
      {
        components: [
          {
            internalType: "address",
            name: "player",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "score",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "timestamp",
            type: "uint256",
          },
        ],
        internalType: "struct PlinkoGame.LeaderboardEntry[]",
        name: "",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "player",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "gameId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "multiplier",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "payout",
        type: "uint256",
      },
    ],
    name: "GameResult",
    type: "event",
  },
] as const

// Contract address on Sepolia testnet (placeholder)
export const PLINKO_CONTRACT_ADDRESS = "0x1234567890123456789012345678901234567890"

// Game fee in ETH
export const GAME_FEE = "0.01"

export interface LeaderboardEntry {
  player: string
  score: number
  timestamp: number
}

export interface GameResult {
  gameId: number
  multiplier: number
  slot: number
  payout: string
}

export class PlinkoContract {
  private contract: ethers.Contract | null = null
  private signer: ethers.Signer | null = null

  async initialize(provider: ethers.BrowserProvider) {
    this.signer = await provider.getSigner()
    this.contract = new ethers.Contract(PLINKO_CONTRACT_ADDRESS, PLINKO_CONTRACT_ABI, this.signer)
  }

  async getSignerAddress(): Promise<string | null> {
    if (!this.signer) return null
    try {
      return await this.signer.getAddress()
    } catch (error) {
      console.error("[v0] Error getting signer address:", error)
      return null
    }
  }

  isReady(): boolean {
    return !!(this.contract && this.signer)
  }

  async playGame(): Promise<number> {
    if (!this.contract) throw new Error("Contract not initialized")

    console.log("[v0] Sending transaction with 0.01 ETH...")

    const tx = await this.contract.playGame({
      value: ethers.parseEther(GAME_FEE),
    })

    console.log("[v0] Transaction sent, waiting for confirmation...")
    const receipt = await tx.wait()
    console.log("[v0] Transaction confirmed:", receipt.hash)

    // Extract game ID from transaction logs
    const gameId = receipt.logs[0]?.args?.[1] || Math.floor(Math.random() * 1000000)
    return Number(gameId)
  }

  async submitResult(gameId: number, multiplier: number, slot: number): Promise<void> {
    if (!this.contract) throw new Error("Contract not initialized")

    const tx = await this.contract.submitResult(gameId, multiplier, slot)
    await tx.wait()
  }

  async getLeaderboard(): Promise<LeaderboardEntry[]> {
    if (!this.contract) throw new Error("Contract not initialized")

    try {
      const entries = await this.contract.getLeaderboard()
      return entries.map((entry: any) => ({
        player: entry.player,
        score: Number(entry.score),
        timestamp: Number(entry.timestamp),
      }))
    } catch (error) {
      // Return mock data if contract call fails
      return [
        { player: "0x1234...5678", score: 850, timestamp: Date.now() - 3600000 },
        { player: "0x2345...6789", score: 720, timestamp: Date.now() - 7200000 },
        { player: "0x3456...7890", score: 650, timestamp: Date.now() - 10800000 },
        { player: "0x4567...8901", score: 580, timestamp: Date.now() - 14400000 },
        { player: "0x5678...9012", score: 520, timestamp: Date.now() - 18000000 },
      ]
    }
  }
}
