<script lang="ts">
  import { onMount } from "svelte"
  import { get } from "svelte/store"
  import { publicNetwork } from "$lib/modules/network"
  import { itemNftConfig, playerAddress } from "$lib/modules/state/stores"
  import { importNFTToItem } from "$lib/modules/on-chain-transactions"
  import { errorHandler } from "$lib/modules/error-handling"
  import { playSound } from "$lib/modules/sound"
  import { createLogger } from "$lib/modules/logger"
  import { CURRENCY_SYMBOL } from "$lib/modules/ui/constants"
  import { SmallButton } from "$lib/components/Shared"
  import { ItemNFTAbi } from "contracts/externalAbis"

  const logger = createLogger("[NFTInventory]")

  let {
    ratId,
    onRefresh
  }: {
    ratId?: string
    onRefresh?: () => void
  } = $props()

  let ownedNFTs = $state<ItemNFT[]>([])
  let loading = $state(true)
  let importing = $state<bigint | null>(null)

  // Get ItemNFT address from store (populated from server hydration)
  function getItemNftAddress(): string | null {
    const config = get(itemNftConfig)
    if (
      config?.itemNftAddress &&
      config.itemNftAddress !== "0x0000000000000000000000000000000000000000"
    ) {
      return config.itemNftAddress
    }
    return null
  }

  async function loadOwnedNFTs() {
    const itemNftAddress = getItemNftAddress()

    if (!itemNftAddress) {
      logger.log("ItemNFT address not configured")
      loading = false
      return
    }

    const publicClient = get(publicNetwork).publicClient
    const account = get(playerAddress)

    if (!account) {
      logger.log("No account connected")
      loading = false
      return
    }

    try {
      // Get balance
      const balance = (await publicClient.readContract({
        address: itemNftAddress as `0x${string}`,
        abi: ItemNFTAbi,
        functionName: "balanceOf",
        args: [account as `0x${string}`]
      })) as bigint

      logger.log("NFT balance:", Number(balance))

      const nfts: ItemNFT[] = []

      // Get each token
      for (let i = 0n; i < balance; i++) {
        const tokenId = (await publicClient.readContract({
          address: itemNftAddress as `0x${string}`,
          abi: ItemNFTAbi,
          functionName: "tokenOfOwnerByIndex",
          args: [account as `0x${string}`, i]
        })) as bigint

        const itemId = (await publicClient.readContract({
          address: itemNftAddress as `0x${string}`,
          abi: ItemNFTAbi,
          functionName: "getItemId",
          args: [tokenId]
        })) as `0x${string}`

        const [name, value] = (await publicClient.readContract({
          address: itemNftAddress as `0x${string}`,
          abi: ItemNFTAbi,
          functionName: "getItemData",
          args: [tokenId]
        })) as [string, bigint]

        nfts.push({ tokenId, itemId, name, value })
      }

      ownedNFTs = nfts
      logger.log("Loaded NFTs:", nfts.length)
    } catch (e) {
      logger.error("Error loading NFTs:", e)
    } finally {
      loading = false
    }
  }

  // Expose refresh function for parent components
  export function refresh() {
    loading = true
    loadOwnedNFTs()
  }

  async function handleImport(tokenId: bigint) {
    if (!ratId) return

    importing = tokenId
    try {
      logger.log("Importing NFT:", { tokenId, ratId })
      const result = await importNFTToItem(ratId, tokenId)
      if (result) {
        logger.log("NFT imported successfully")
        playSound({ category: "ratfunUI", id: "itemPositive" })
        // Reload NFTs
        await loadOwnedNFTs()
        // Notify parent to refresh inventory
        onRefresh?.()
      }
    } catch (e) {
      errorHandler(e)
    } finally {
      importing = null
    }
  }

  onMount(() => {
    loadOwnedNFTs()
  })
</script>

<div class="nft-inventory">
  <div class="header">Item NFTs</div>

  {#if loading}
    <div class="loading">Loading...</div>
  {:else if ownedNFTs.length === 0}
    <div class="empty">No Item NFTs owned</div>
  {:else}
    <div class="nft-list">
      {#each ownedNFTs as nft (nft.tokenId.toString())}
        <div class="nft-item">
          <div class="nft-info">
            <div class="nft-name">{nft.name}</div>
            <div class="nft-value">{Number(nft.value)} {CURRENCY_SYMBOL}</div>
          </div>
          <SmallButton
            text="Import"
            disabled={importing !== null || !ratId}
            onclick={() => handleImport(nft.tokenId)}
          />
        </div>
      {/each}
    </div>
  {/if}
</div>

<style lang="scss">
  .nft-inventory {
    padding: 10px;
    background: var(--background-semi-transparent);
    border: var(--dashed-border-style);
  }

  .header {
    font-family: var(--special-font-stack);
    font-size: var(--font-size-medium);
    margin-bottom: 10px;
    text-align: center;
  }

  .loading,
  .empty {
    text-align: center;
    opacity: 0.7;
    font-size: var(--font-size-small);
  }

  .nft-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .nft-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px;
    background: var(--color-inventory-item-background);
    border: 2px solid var(--foreground);
  }

  .nft-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .nft-name {
    font-family: var(--special-font-stack);
    font-size: var(--font-size-small);
  }

  .nft-value {
    font-size: var(--font-size-xsmall);
    opacity: 0.8;
  }
</style>
