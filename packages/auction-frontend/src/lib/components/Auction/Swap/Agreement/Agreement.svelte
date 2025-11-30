<script lang="ts">
  import { buyLimitSetCountryCode } from "doppler"
  import { BigButton, Checkbox } from "$lib/components/Shared"
  import { prepareConnectorClientForTransaction } from "$lib/modules/drawbridge/connector"
  import { userAddress } from "$lib/modules/drawbridge"
  import { publicClient as publicClientStore } from "$lib/network"
  import { asPublicClient, asWalletClient } from "$lib/utils/clientAdapter"
  import { swapState, SWAP_STATE } from "../state.svelte"

  let accepted = $state(false)
  let isProcessing = $state(false)

  /**
   * Get country code from user's IP using Cloudflare trace
   * Falls back to "US" if unable to determine
   */
  async function getCountryCodeFromIP(): Promise<string> {
    try {
      const response = await fetch("https://www.cloudflare.com/cdn-cgi/trace")
      const text = await response.text()
      const countryLine = text.split("\n").find(line => line.startsWith("loc="))
      const countryCode = countryLine?.split("=")[1]?.trim()

      if (countryCode && countryCode.length === 2) {
        console.log("[CountryCode] Detected country from IP:", countryCode)
        return countryCode
      }

      console.warn("[CountryCode] Invalid country code format, using fallback")
      return "US"
    } catch (error) {
      console.error("[CountryCode] Failed to fetch country from IP:", error)
      return "US"
    }
  }

  async function sendCountryCode() {
    if (isProcessing) return
    isProcessing = true

    try {
      if (!$userAddress) throw new Error("wallet not connected")
      const auctionParams = swapState.data.auctionParams
      if (!auctionParams) throw new Error("auction params not initialized")

      // Get country code from IP
      const countryCode = await getCountryCodeFromIP()

      const client = await prepareConnectorClientForTransaction()
      const txHash = await buyLimitSetCountryCode(
        asWalletClient(client),
        auctionParams.token.address,
        countryCode
      )
      await asPublicClient($publicClientStore!).waitForTransactionReceipt({ hash: txHash })

      // Update state and transition to swap
      swapState.data.setSavedCountryCode(countryCode)
      swapState.state.transitionTo(SWAP_STATE.SIGN_AND_SWAP)
    } catch (error) {
      console.error("[Agreement] Error sending country code:", error)
      throw error
    } finally {
      isProcessing = false
    }
  }
</script>

<div class="agreement-container">
  <label class="agreement-label">
    <Checkbox bind:checked={accepted} />
    <span class="agreement-text">
      I accept the <a href="/documents/sale-terms.pdf" target="_blank" rel="noopener noreferrer"
        >Sale Terms</a
      >,
      <a href="/documents/white-paper.pdf" target="_blank" rel="noopener noreferrer">White Paper</a>
      and
      <a href="/documents/privacy-notice.pdf" target="_blank" rel="noopener noreferrer"
        >Privacy Notice</a
      >. I understand that $RAT has no profit or governance rights and that RAT.FUN is experimental.
    </span>
  </label>
</div>

<div class="button-container">
  <BigButton
    text={isProcessing ? "Processing..." : "Continue"}
    disabled={!accepted || isProcessing}
    onclick={() => {
      sendCountryCode()
    }}
  />
</div>

<style lang="scss">
  .agreement-container {
    display: flex;
    flex-flow: column nowrap;
    align-items: flex-start;
    justify-content: center;
    padding: 20px;
    margin-bottom: 20px;
  }

  .agreement-label {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    cursor: pointer;
    user-select: none;
  }

  .agreement-text {
    font-size: var(--font-size-normal);
    line-height: 1.5;
    color: white;

    a {
      color: var(--color-alert-priority);
      text-decoration: underline;
      font-weight: bold;

      &:hover {
        color: var(--color-alert-priority-light);
      }
    }
  }

  .button-container {
    width: 100%;
    height: 160px;
    display: flex;
    justify-content: center;
    align-items: center;
  }
</style>
