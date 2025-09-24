<script lang="ts">
  import { rat } from "$lib/modules/state/stores"
  import { BigButton } from "$lib/components/Shared"
  import { transitionTo, RAT_BOX_STATE } from "$lib/components/Rat/state.svelte"
  import { sendApproveMax } from "$lib/modules/action-manager/index.svelte"

  let busy = $state(false)

  const onClick = async () => {
    busy = true
    await sendApproveMax()

    if ($rat) {
      transitionTo(RAT_BOX_STATE.HAS_RAT)
    } else {
      transitionTo(RAT_BOX_STATE.NO_RAT)
    }
  }

  let filter = $derived(`grayscale(100%)`)
</script>

<div class="no-allowance">
  <!-- <div class="image-container">
    <img style:filter src="/images/mascot1.png" alt="Rat" />
  </div> -->
  <div class="button-container">
    <BigButton text="Approve max allowance" disabled={busy} onclick={onClick} />
  </div>
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
