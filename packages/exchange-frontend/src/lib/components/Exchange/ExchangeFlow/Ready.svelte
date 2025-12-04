<script lang="ts">
  import { exchangeFlowState, EXCHANGE_FLOW_STATE } from "./state.svelte"
  import {
    approveFakeTokenForExchange,
    exchangeFakeToken
  } from "$lib/modules/on-chain-transactions/fakeToken"
  import { refetchBalances } from "$lib/modules/erc20Listener"
  import { BigButton } from "$lib/components/Shared"

  let isProcessing = $state(false)

  async function handleExchange() {
    if (isProcessing) return
    isProcessing = true

    const amount = exchangeFlowState.data.exchangeAmount

    try {
      // Step 1: Approve
      exchangeFlowState.state.transitionTo(EXCHANGE_FLOW_STATE.APPROVING)
      const approveResult = await approveFakeTokenForExchange(amount)

      if (!approveResult) {
        exchangeFlowState.data.setErrorMessage("Approval transaction failed or was rejected")
        exchangeFlowState.state.transitionTo(EXCHANGE_FLOW_STATE.ERROR)
        return
      }

      exchangeFlowState.data.setApproveTxHash(approveResult.transactionHash)

      // Step 2: Exchange
      exchangeFlowState.state.transitionTo(EXCHANGE_FLOW_STATE.EXCHANGING)
      const exchangeResult = await exchangeFakeToken(amount)

      if (!exchangeResult) {
        exchangeFlowState.data.setErrorMessage("Exchange transaction failed or was rejected")
        exchangeFlowState.state.transitionTo(EXCHANGE_FLOW_STATE.ERROR)
        return
      }

      exchangeFlowState.data.setExchangeTxHash(exchangeResult.transactionHash)

      // Refetch balances and complete
      await refetchBalances()
      exchangeFlowState.state.transitionTo(EXCHANGE_FLOW_STATE.COMPLETE)
    } catch (error) {
      console.error("[ExchangeFlow] Error:", error)
      exchangeFlowState.data.setErrorMessage(
        error instanceof Error ? error.message : "Unknown error"
      )
      exchangeFlowState.state.transitionTo(EXCHANGE_FLOW_STATE.ERROR)
    } finally {
      isProcessing = false
    }
  }
</script>

<div class="ready">
  <div class="info">
    <div>Swap</div>
    <div>
      <span class="amount">{exchangeFlowState.data.exchangeAmount} $FAKERAT</span>
    </div>
    <div>for</div>
    <div>
      <span class="amount">{exchangeFlowState.data.exchangeAmount} $RAT</span>
    </div>
  </div>
  <div class="button-container">
    <BigButton
      text="Swap all $FAKERAT"
      disabled={isProcessing || exchangeFlowState.data.exchangeAmount === 0}
      onclick={handleExchange}
    />
  </div>
</div>

<style lang="scss">
  .ready {
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
    width: 100%;

    .info {
      width: 100%;
      font-size: var(--font-size-large);
      font-family: var(--special-font-stack);
      color: black;
      background: var(--white);
      padding: 20px;
      line-height: 1.5em;
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: center;
      gap: 1ch;

      @media (max-width: 768px) {
        flex-direction: column;
        gap: 0;
      }

      .amount {
        color: white;
        background: var(--black);
        padding: 2px 5px;
      }
    }

    .button-container {
      width: 100%;
      height: 160px;
    }
  }
</style>
