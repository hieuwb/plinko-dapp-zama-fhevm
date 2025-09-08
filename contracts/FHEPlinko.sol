// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { FHE, euint32, externalEuint32, ebool } from "@fhevm/solidity/lib/FHE.sol";
import { SepoliaConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title Confidential Plinko Game using FHEVM
contract FHEPlinko is SepoliaConfig {
    mapping(address => euint32) private balances;

    uint32 constant ROWS = 12;
    uint32[13] public multipliers = [1, 2, 3, 4, 5, 6, 10, 6, 5, 4, 3, 2, 1]; // Example multipliers for positions 0-12

    /// @notice Play Plinko with an encrypted bet
    /// @dev Generates confidential random path, computes payout homomorphically
    function play(externalEuint32 encryptedBet, bytes calldata inputProof) external {
        euint32 bet = FHE.fromExternal(encryptedBet, inputProof);

        euint32 position = FHE.asEuint32(0); // Initialize position as encrypted 0
        for (uint i = 0; i < ROWS; i++) {
            ebool isRight = FHE.randEbool();
            // Use FHE.select to choose between encrypted 0 and 1 based on isRight
            euint32 dir = FHE.select(isRight, FHE.asEuint32(1), FHE.asEuint32(0));
            position = FHE.add(position, dir); // Add direction to position
        }

        euint32 multiplier = FHE.asEuint32(0); // Initialize multiplier as encrypted 0
        for (uint i = 0; i < 13; i++) {
            euint32 currentPosition = FHE.asEuint32(uint32(i)); // Create encrypted i
            ebool eq = FHE.eq(position, currentPosition); // Compare encrypted values
            euint32 currentMultiplier = FHE.asEuint32(multipliers[i]); // Convert multiplier to euint32
            multiplier = FHE.select(eq, currentMultiplier, multiplier); // Select correct multiplier
        }

        euint32 payout = FHE.mul(bet, multiplier);
        balances[msg.sender] = FHE.add(balances[msg.sender], payout);

        FHE.allowThis(balances[msg.sender]);
        FHE.allow(balances[msg.sender], msg.sender);
    }

    /// @notice Get encrypted balance
    function getBalance() external view returns (euint32) {
        return balances[msg.sender];
    }
}
