<script lang="ts">
  import { player } from "$lib/modules/state/stores"
  import { playSound } from "$lib/modules/sound"
  import { BigButton, ResizableText } from "$lib/components/Shared"
  import { ratState, RAT_BOX_STATE } from "$lib/components/Rat/state.svelte"
  import { exportItemToNFT } from "$lib/modules/on-chain-transactions"
  import { errorHandler } from "$lib/modules/error-handling"
  import { createLogger } from "$lib/modules/logger"
  import { CURRENCY_SYMBOL } from "$lib/modules/ui/constants"

  const logger = createLogger("[ConfirmExtractNFT]")

  // Get item data from ratState
  let itemId = $derived(ratState.exportItem.itemId)
  let itemName = $derived(ratState.exportItem.itemName)
  let itemValue = $derived(ratState.exportItem.itemValue)

  // Get current rat ID
  let ratId = $derived($player?.currentRat as string | undefined)

  let isExtracting = $state(false)

  const onClickConfirm = async () => {
    if (!itemId || !ratId) return

    isExtracting = true
    try {
      logger.log("Exporting item to NFT:", { itemId, ratId })
      const result = await exportItemToNFT(ratId, itemId)
      if (result) {
        logger.log("Item exported successfully")
        playSound({ category: "ratfunUI", id: "itemPositive" })
      }
    } catch (e) {
      errorHandler(e)
    } finally {
      isExtracting = false
      // Always transition back to inventory after export attempt (success or failure)
      ratState.exportItem.clear()
      ratState.state.transitionTo(RAT_BOX_STATE.HAS_RAT)
    }
  }

  const onClickAbort = () => {
    playSound({ category: "ratfunUI", id: "smallButtonUp" })
    ratState.exportItem.clear()
    ratState.state.transitionTo(RAT_BOX_STATE.HAS_RAT)
  }
</script>

<div class="confirm-export">
  <div class="confirm-export-content">
    <!-- <div class="header">EXPORT TO NFT</div> -->

    <div class="item-preview">
      <div class="item-name">
        <ResizableText>
          {itemName ?? "Unknown Item"}
        </ResizableText>
      </div>
      <div class="flexy-row">
        <div class="item-value">{itemValue ?? 0} {CURRENCY_SYMBOL}</div>
      </div>
    </div>

    <div class="warning-text">
      This will remove the item from your RAT's inventory and mint it as an NFT to your wallet.
    </div>

    <div class="button-container">
      <div class="abort-button-container">
        <BigButton text="Cancel" type="abort" onclick={onClickAbort} disabled={isExtracting} />
      </div>
      <div class="confirm-button-container">
        <BigButton text="Extract" type="confirm" onclick={onClickConfirm} disabled={isExtracting} />
      </div>
    </div>
  </div>
</div>

<style lang="scss">
  .confirm-export {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    position: relative;
    width: 100%;
    height: 100%;
    text-align: center;
    background-image: url("/images/texture-2.png");
    background-size: 200px;

    .confirm-export-content {
      width: calc(100% - 40px);
      display: flex;
      flex-direction: column;
      gap: 16px;

      .item-preview {
        width: 200px;
        height: 240px;
        margin: 0 auto;
        padding: 20px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
        position: relative;
        background-color: var(--color-inventory-item-background);
        color: var(--background);
        padding: 5px;
        border: 8px ridge var(--background-semi-transparent);
        outline: none;
        box-shadow: 0 4px 8px var(--background-light-transparent);

        .flexy-row {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 8px;
        }

        .item-name {
          height: 300px;
          width: 200px;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 24px;
          // line-height: 200px;
          font-family: var(--special-font-stack);
          // font-size: var(--font-size-large);
          color: var(--background);
        }

        .item-value {
          font-family: var(--typewriter-font-stack);
          font-size: var(--font-size-medium);
          color: var(--background);
          opacity: 0.8;
        }
      }

      .warning-text {
        padding: 10px;
        background: var(--foreground-semi-transparent);
        color: var(--background);
        font-family: var(--typewriter-font-stack);
        font-size: var(--font-size-small);
      }

      .button-container {
        overflow: hidden;
        width: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        flex-direction: row;
        gap: 10px;
        height: 80px;

        @media (max-width: 800px) {
          width: 100%;
          flex-direction: column;
          height: auto;
        }

        .abort-button-container {
          width: 100%;
          height: 100%;

          @media (max-width: 800px) {
            order: 3;
          }
        }

        .confirm-button-container {
          width: 100%;
          height: 100%;

          @media (max-width: 800px) {
            order: 1;
          }
        }
      }
    }
  }
</style>
