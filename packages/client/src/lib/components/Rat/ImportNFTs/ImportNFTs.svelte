<script lang="ts">
  import { onMount } from "svelte"
  import { get } from "svelte/store"
  import { publicNetwork } from "$lib/modules/network"
  import { itemNftConfig, playerAddress, player, rat } from "$lib/modules/state/stores"
  import { importNFTToItem } from "$lib/modules/on-chain-transactions"
  import { errorHandler } from "$lib/modules/error-handling"
  import { getRarityColor, getRarityLabel, getRarityTextColor } from "$lib/modules/ui/item-rarity"
  import { playSound } from "$lib/modules/sound"
  import { createLogger } from "$lib/modules/logger"
  import { CURRENCY_SYMBOL } from "$lib/modules/ui/constants"
  import { SmallButton, BackButton, ResizableText } from "$lib/components/Shared"
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
    <div class="title">PsychoObjects NFT Vault</div>
    <div class="inventory-status">
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
          <div
            class="nft-item"
            style="background-color: {getRarityColor(nft.value)}; color: {getRarityTextColor(
              nft.value
            )}"
          >
            <div class="nft-left">
              <div class="rarity-indicator">
                <div class="nft-value">
                  {nft.value}
                </div>
              </div>
              <div class="nft-details">
                <ResizableText>
                  {nft.name} ({getRarityLabel(nft.value)})
                </ResizableText>
              </div>
            </div>
            <div class="nft-actions">
              <SmallButton
                text={importing === nft.tokenId ? "Injecting..." : "Inject"}
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
    background-image: url("/images/texture-4.png");

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
    background-image: url("/images/texture-3.png");
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
    height: 100px;
    // padding: 12px;
    background: var(--background-semi-transparent);
    // border: 2px solid var(--foreground);
  }

  .nft-left {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
  }

  .rarity-indicator {
    padding: 4px 8px;
    color: white;
    background: var(--color-grey-dark);
    font-family: var(--special-font-stack);
    font-size: var(--font-size-xsmall);
    text-transform: uppercase;
    display: flex;
    flex-flow: column nowrap;
    justify-content: center;
    align-items: center;
    white-space: nowrap;
    height: 100%;
    border: none;
    border-style: outset;
    border-width: 4px;
    border-color: var(--background-light-transparent);
  }

  .nft-details {
    height: 100%;
    width: 100%;
    padding: 12px;
    display: block;
    font-family: var(--special-font-stack);
    border: none;
    border-style: outset;
    border-width: 4px;
    border-color: var(--background-light-transparent);
  }

  .nft-name {
    width: 100%;
    height: 100%;
    font-family: var(--special-font-stack);
    // font-size: var(--font-size-medium);
  }

  .nft-value {
    font-family: var(--typewriter-font-stack);
    font-size: var(--font-size-large);
    color: var(--foreground);
    opacity: 0.8;
    width: 50px;
    padding: 12px;
    // height: 100%;
  }

  .nft-actions {
    flex-shrink: 0;
    height: 100%;
    width: 120px;
  }

  .back-button-container {
    border-top: var(--default-border-style);
    display: flex;
    justify-content: center;
  }
</style>
