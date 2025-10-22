<script lang="ts">
  import { tokenAllowanceApproved, playerIsBroke } from "$lib/modules/state/stores"
  import { BigButton } from "$lib/components/Shared"
  import { transitionTo, RAT_BOX_STATE } from "$lib/components/Rat/state.svelte"
  import { sendGiveCallerTokens } from "$lib/modules/action-manager/index.svelte"
  import { SmallSpinner } from "$lib/components/Shared"
  import { environment } from "$lib/modules/network"
  import { ENVIRONMENT } from "$lib/mud/enums"

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
    await sendGiveCallerTokens()

    if ($tokenAllowanceApproved) {
      transitionTo(RAT_BOX_STATE.NO_RAT)
    } else {
      transitionTo(RAT_BOX_STATE.NO_ALLOWANCE)
    }
  }
</script>

<div class="no-tokens">
  {#if busy}
    <div class="loading">Getting tokens <SmallSpinner soundOn /></div>
  {:else if $environment == ENVIRONMENT.BASE}
    <div class="notice">You do not have $RAT tokens. Come back later...</div>
  {:else}
    <div class="button-container">
      <BigButton text="Get 2000 $RAT" disabled={busy} onclick={onClick} />
    </div>
  {/if}
</div>

<style lang="scss">
  .no-tokens {
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

    .notice {
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
