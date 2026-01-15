<script lang="ts">
  import { onMount } from "svelte"
  import { get } from "svelte/store"
  import { publicNetwork } from "$lib/modules/network"
  import { itemNftConfig, playerAddress, player, rat } from "$lib/modules/state/stores"
  import { importNFTToItem } from "$lib/modules/on-chain-transactions"
  import { errorHandler } from "$lib/modules/error-handling"
  import { playSound } from "$lib/modules/sound"
  import { createLogger } from "$lib/modules/logger"
  import { CURRENCY_SYMBOL } from "$lib/modules/ui/constants"
  import { SmallButton, BackButton } from "$lib/components/Shared"
  import { ratState, RAT_BOX_STATE } from "$lib/components/Rat/state.svelte"
  import { getRatInventory } from "$lib/modules/state/utils"

  const logger = createLogger("[ImportNFTs]")

  const MAX_INVENTORY_SIZE = 6

  // NFT contract ABI (minimal for reading)
  const ITEM_NFT_ABI = [
    {
      inputs: [{ name: "owner", type: "address" }],
      name: "balanceOf",
      outputs: [{ name: "", type: "uint256" }],
      stateMutability: "view",
      type: "function"
    },
    {
      inputs: [
        { name: "owner", type: "address" },
        { name: "index", type: "uint256" }
      ],
      name: "tokenOfOwnerByIndex",
      outputs: [{ name: "", type: "uint256" }],
      stateMutability: "view",
      type: "function"
    },
    {
      inputs: [{ name: "tokenId", type: "uint256" }],
      name: "getItemId",
      outputs: [{ name: "itemId", type: "bytes32" }],
      stateMutability: "view",
      type: "function"
    },
    {
      inputs: [{ name: "tokenId", type: "uint256" }],
      name: "getItemData",
      outputs: [
        { name: "name", type: "string" },
        { name: "value", type: "uint256" }
      ],
      stateMutability: "view",
      type: "function"
    }
  ] as const

  interface OwnedNFT {
    tokenId: bigint
    itemId: string
    name: string
    value: number
  }

  let ownedNFTs = $state<OwnedNFT[]>([])
  let loading = $state(true)
  let importing = $state<bigint | null>(null)

  // Get current rat ID
  let ratId = $derived($player?.currentRat as string | undefined)

  // Get current inventory size
  let inventorySize = $derived($rat ? getRatInventory($rat).length : 0)
  let inventoryFull = $derived(inventorySize >= MAX_INVENTORY_SIZE)

  // Get ItemNFT address from store
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

  // Determine rarity color based on value
  function getRarityColor(value: number): string {
    if (value >= 100) return "#9333ea" // Purple
    if (value >= 50) return "#eab308" // Yellow
    if (value >= 20) return "#9ca3af" // Gray
    return "#b45309" // Brown
  }

  function getRarityLabel(value: number): string {
    if (value >= 100) return "Legendary"
    if (value >= 50) return "Rare"
    if (value >= 20) return "Uncommon"
    return "Common"
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
      const balance = (await publicClient.readContract({
        address: itemNftAddress as `0x${string}`,
        abi: ITEM_NFT_ABI,
        functionName: "balanceOf",
        args: [account as `0x${string}`]
      })) as bigint

      logger.log("NFT balance:", { count: Number(balance) })

      const nfts: OwnedNFT[] = []

      for (let i = 0n; i < balance; i++) {
        const tokenId = (await publicClient.readContract({
          address: itemNftAddress as `0x${string}`,
          abi: ITEM_NFT_ABI,
          functionName: "tokenOfOwnerByIndex",
          args: [account as `0x${string}`, i]
        })) as bigint

        const itemId = (await publicClient.readContract({
          address: itemNftAddress as `0x${string}`,
          abi: ITEM_NFT_ABI,
          functionName: "getItemId",
          args: [tokenId]
        })) as `0x${string}`

        const [name, value] = (await publicClient.readContract({
          address: itemNftAddress as `0x${string}`,
          abi: ITEM_NFT_ABI,
          functionName: "getItemData",
          args: [tokenId]
        })) as [string, bigint]

        nfts.push({
          tokenId,
          itemId: itemId.toString(),
          name,
          value: Number(value)
        })
      }

      ownedNFTs = nfts
      logger.log("Loaded NFTs:", { count: nfts.length })

      // If no NFTs, go back to HAS_RAT
      if (nfts.length === 0) {
        ratState.state.transitionTo(RAT_BOX_STATE.HAS_RAT)
      }
    } catch (e) {
      logger.error("Error loading NFTs:", e)
    } finally {
      loading = false
    }
  }

  async function handleImport(tokenId: bigint) {
    if (!ratId || inventoryFull) return

    importing = tokenId
    try {
      logger.log("Importing NFT:", { tokenId: tokenId.toString(), ratId })
      const result = await importNFTToItem(ratId, tokenId)
      if (result) {
        logger.log("NFT imported successfully")
        playSound({ category: "ratfunUI", id: "itemPositive" })
        // Reload NFTs
        await loadOwnedNFTs()
      }
    } catch (e) {
      errorHandler(e)
    } finally {
      importing = null
    }
  }

  const handleBack = () => {
    playSound({ category: "ratfunUI", id: "smallButtonUp" })
    ratState.state.transitionTo(RAT_BOX_STATE.HAS_RAT)
  }

  onMount(() => {
    loadOwnedNFTs()
  })
</script>

<div class="import-nfts">
  <div class="header">
    <div class="title">IMPORT PSYCHO OBJECTS</div>
    <div class="inventory-status">
      Inventory: {inventorySize}/{MAX_INVENTORY_SIZE}
      {#if inventoryFull}
        <span class="full-warning">(Full)</span>
      {/if}
    </div>
  </div>

  <div class="nft-list-container">
    {#if loading}
      <div class="loading">Loading NFTs...</div>
    {:else if ownedNFTs.length === 0}
      <div class="empty">No Item NFTs owned</div>
    {:else}
      <div class="nft-list">
        {#each ownedNFTs as nft (nft.tokenId.toString())}
          <div class="nft-item">
            <div class="nft-left">
              <div class="rarity-indicator" style="background-color: {getRarityColor(nft.value)}">
                {getRarityLabel(nft.value)}
              </div>
              <div class="nft-details">
                <div class="nft-name">{nft.name}</div>
                <div class="nft-value">{nft.value} {CURRENCY_SYMBOL}</div>
              </div>
            </div>
            <div class="nft-actions">
              <SmallButton
                text={importing === nft.tokenId ? "Importing..." : "Import"}
                disabled={importing !== null || !ratId || inventoryFull}
                onclick={() => handleImport(nft.tokenId)}
              />
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>

  <div class="back-button-container">
    <BackButton onclick={handleBack} />
  </div>
</div>

<style lang="scss">
  .import-nfts {
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
    background-image: url("/images/texture-2.png");
    background-size: 200px;
  }

  .header {
    padding: 20px;
    border-bottom: var(--default-border-style);
    text-align: center;

    .title {
      font-family: var(--special-font-stack);
      font-size: var(--font-size-extra-large);
      color: var(--foreground);
      margin-bottom: 8px;
    }

    .inventory-status {
      font-family: var(--typewriter-font-stack);
      font-size: var(--font-size-small);
      color: var(--foreground);
      opacity: 0.8;

      .full-warning {
        color: var(--color-red);
      }
    }
  }

  .nft-list-container {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
  }

  .loading,
  .empty {
    text-align: center;
    padding: 40px;
    font-family: var(--typewriter-font-stack);
    color: var(--foreground);
    opacity: 0.7;
  }

  .nft-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .nft-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px;
    background: var(--background-semi-transparent);
    border: 2px solid var(--foreground);
  }

  .nft-left {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .rarity-indicator {
    padding: 4px 8px;
    color: white;
    font-family: var(--special-font-stack);
    font-size: var(--font-size-xsmall);
    text-transform: uppercase;
    white-space: nowrap;
  }

  .nft-details {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .nft-name {
    font-family: var(--special-font-stack);
    font-size: var(--font-size-medium);
    color: var(--foreground);
  }

  .nft-value {
    font-family: var(--typewriter-font-stack);
    font-size: var(--font-size-small);
    color: var(--foreground);
    opacity: 0.8;
  }

  .nft-actions {
    flex-shrink: 0;
  }

  .back-button-container {
    padding: 16px;
    border-top: var(--default-border-style);
    display: flex;
    justify-content: center;
  }
</style>
