<script lang="ts">
  import { rat, playerIsBroke } from "$lib/modules/state/stores"
  import { BigButton } from "$lib/components/Shared"
  import { transitionTo, RAT_BOX_STATE } from "$lib/components/Rat/state.svelte"
  import { sendApproveMax } from "$lib/modules/action-manager/index.svelte"
  import { SmallSpinner } from "$lib/components/Shared"

  let busy = $state(false)

  $effect(() => {
    if (!$playerIsBroke) {
      // HACK: for some reason we might end up here without actually being broke
      // Move on if player got tokens
      transitionTo(RAT_BOX_STATE.NO_RAT)
    }
  })

  const onClick = async () => {
    busy = true
    await sendApproveMax()

    if ($rat) {
      transitionTo(RAT_BOX_STATE.HAS_RAT)
    } else {
      transitionTo(RAT_BOX_STATE.NO_RAT)
    }
  }
</script>

<div class="no-allowance">
  {#if busy}
    <div class="loading">Approving allowance <SmallSpinner soundOn /></div>
  {:else}
    <div class="button-container">
      <BigButton text="Approve max allowance" disabled={busy} onclick={onClick} />
    </div>
  {/if}
</div>

<style lang="scss">
  .no-allowance {
    text-align: center;
    color: var(--white);
    width: 100%;
    height: 100%;
    overflow: hidden;
    position: relative;
    background-image: url("/images/texture-2.png");
    background-size: 200px;
    display: flex;
    justify-content: center;
    align-items: center;

    .loading {
      font-size: var(--font-size-normal);
      font-family: var(--typewriter-font-stack);
      color: black;
      background: orangered;
      padding: 10px;
    }

    .button-container {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translateX(-50%) translateY(-50%);
      overflow: hidden;
      width: 90%;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 200px;
    }
  }
</style>
