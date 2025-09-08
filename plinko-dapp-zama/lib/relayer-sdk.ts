import { createInstance, SepoliaConfig } from "@zama-fhe/relayer-sdk";

// Singleton Relayer instance
let relayer: Awaited<ReturnType<typeof createInstance>> | null = null;

export async function initRelayer() {
  if (!relayer) {
    relayer = await createInstance(SepoliaConfig);
  }
  return relayer;
}

export async function publicDecrypt(contractAddress: string, ciphertext: `0x${string}`): Promise<string> {
  if (!relayer) {
    relayer = await createInstance(SepoliaConfig);
  }
  return await relayer.publicDecrypt(contractAddress, ciphertext);
}

export async function userDecrypt(
  contractAddress: string,
  ciphertext: `0x${string}`
): Promise<string> {
  if (!relayer) {
    relayer = await createInstance(SepoliaConfig);
  }
  return await relayer.userDecrypt(contractAddress, ciphertext);
}
