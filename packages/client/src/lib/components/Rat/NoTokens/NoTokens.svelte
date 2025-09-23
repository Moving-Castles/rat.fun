<script lang="ts">
  import { tokenAllowanceApproved } from "$lib/modules/state/stores"
  import { BigButton } from "$lib/components/Shared"
  import { transitionTo, RAT_BOX_STATE } from "../RatBox/state.svelte"
  import { sendGiveCallerTokens } from "$lib/modules/action-manager/index.svelte"

  let busy = $state(false)

  const onClick = async () => {
    busy = true
    await sendGiveCallerTokens()

    if ($tokenAllowanceApproved) {
      transitionTo(RAT_BOX_STATE.NO_RAT)
    } else {
      transitionTo(RAT_BOX_STATE.NO_ALLOWANCE)
    }
  }

  let filter = $derived(`grayscale(100%)`)
</script>

<div class="no-tokens">
  <!-- <div class="image-container">
    <img style:filter src="/images/mascot1.png" alt="Rat" />
  </div> -->
  <div class="button-container">
    <BigButton text="Get 2000 $Slopamine (free)" disabled={busy} onclick={onClick} />
  </div>
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

    .image-container {
      display: flex;
      flex-flow: column nowrap;
      justify-content: center;
      align-items: center;
      height: 100%;
      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        object-position: 100% 20%;
        opacity: 0.8;
      }
    }

    .button-container {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translateX(-50%) translateY(0);
      overflow: hidden;
      width: 80%;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 80px;
    }
  }
</style>
