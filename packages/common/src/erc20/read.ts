import { Chain, erc20Abi, Hex, PublicClient, Transport } from "viem";

/**
 * Read the player's ERC20 balance
 * @param publicNetwork - The public network to read the balance from
 * @param erc20Address - The address of the ERC20 token to read the balance for
 * @param ownerAddress - The address of the owner to read the balance for
 * @returns The balance of the player's ERC20 token
 */
export async function readERC20Balance(
  publicClient: PublicClient<Transport, Chain>,
  erc20Address: Hex,
  ownerAddress: Hex
) {
  return await publicClient.readContract({
    address: erc20Address,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [ownerAddress]
  })
}

/**
 * Read the player's ERC20 allowance
 * @param publicNetwork - The public network to read the allowance from
 * @param erc20Address - The address of the ERC20 token to read the allowance for
 * @param ownerAddress - The address of the owner to read the allowance for
 * @param spenderAddress - The address of the spender to read the allowance for
 * @returns The allowance of the player's ERC20 token
 */
export async function readERC20Allowance(
  publicClient: PublicClient<Transport, Chain>,
  erc20Address: Hex,
  ownerAddress: Hex,
  spenderAddress: Hex,
) {
  return await publicClient.readContract({
    address: erc20Address,
    abi: erc20Abi,
    functionName: "allowance",
    args: [ownerAddress, spenderAddress]
  })
}