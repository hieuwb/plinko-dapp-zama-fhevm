import { ethers } from "ethers"

// EIP-712 domain for Plinko dApp
export const EIP712_DOMAIN = {
  name: "Plinko dApp",
  version: "1",
  chainId: 11155111, // Sepolia testnet
  verifyingContract: "0x1234567890123456789012345678901234567890",
}

// EIP-712 types for authentication
export const EIP712_TYPES = {
  Authentication: [
    { name: "player", type: "address" },
    { name: "timestamp", type: "uint256" },
    { name: "nonce", type: "string" },
  ],
}

export interface AuthenticationMessage {
  player: string
  timestamp: number
  nonce: string
}

export class EIP712Signer {
  private signer: ethers.Signer | null = null

  constructor(signer: ethers.Signer) {
    this.signer = signer
  }

  async signAuthentication(playerAddress: string): Promise<{ message: AuthenticationMessage; signature: string }> {
    if (!this.signer) throw new Error("Signer not initialized")

    const message: AuthenticationMessage = {
      player: playerAddress,
      timestamp: Math.floor(Date.now() / 1000),
      nonce: Math.random().toString(36).substring(2, 15),
    }

    try {
      const signature = await this.signer.signTypedData(EIP712_DOMAIN, EIP712_TYPES, message)

      return { message, signature }
    } catch (error) {
      console.error("Error signing EIP-712 message:", error)
      throw new Error("Failed to sign authentication message")
    }
  }

  static verifySignature(message: AuthenticationMessage, signature: string, expectedAddress: string): boolean {
    try {
      const recoveredAddress = ethers.verifyTypedData(EIP712_DOMAIN, EIP712_TYPES, message, signature)

      return recoveredAddress.toLowerCase() === expectedAddress.toLowerCase()
    } catch (error) {
      console.error("Error verifying signature:", error)
      return false
    }
  }
}
