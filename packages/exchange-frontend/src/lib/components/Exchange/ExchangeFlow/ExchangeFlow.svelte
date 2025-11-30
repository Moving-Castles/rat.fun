<script lang="ts">
  import { onMount } from "svelte"
  import { fakeRatTokenBalance } from "$lib/modules/erc20Listener/stores"
  import { exchangeFlowState, EXCHANGE_FLOW_STATE } from "./state.svelte"
  import { Ready, Approving, Exchanging, Complete, Error as ErrorComponent } from "./index"

  onMount(() => {
    // Reset state
    exchangeFlowState.state.reset()
    exchangeFlowState.data.reset()

    // Set exchange amount from current balance
    exchangeFlowState.data.setExchangeAmount($fakeRatTokenBalance)

    // Transition to ready
    exchangeFlowState.state.transitionTo(EXCHANGE_FLOW_STATE.READY)
  })
</script>

{#if exchangeFlowState.state.current === EXCHANGE_FLOW_STATE.READY}
  <Ready />
{:else if exchangeFlowState.state.current === EXCHANGE_FLOW_STATE.APPROVING}
  <Approving />
{:else if exchangeFlowState.state.current === EXCHANGE_FLOW_STATE.EXCHANGING}
  <Exchanging />
{:else if exchangeFlowState.state.current === EXCHANGE_FLOW_STATE.COMPLETE}
  <Complete />
{:else if exchangeFlowState.state.current === EXCHANGE_FLOW_STATE.ERROR}
  <ErrorComponent />
{/if}
