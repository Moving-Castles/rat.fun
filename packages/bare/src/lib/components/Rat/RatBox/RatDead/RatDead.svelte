<script lang="ts">
  import { rat } from "$lib/modules/state/stores"
  import { ratImageUrl } from "$lib/modules/state/stores"
  import { BigButton } from "$lib/components/Shared"
  import { transitionTo, RAT_BOX_STATE } from "../state.svelte"

  const onClick = () => {
    // RAT_BOX_STATE.DEAD_RAT -> RAT_BOX_STATE.NO_RAT
    transitionTo(RAT_BOX_STATE.NO_RAT)
  }
</script>

<div class="rat-dead">
  <div class="rat-dead-image">
    <img src={$ratImageUrl} alt="Rat Dead" />
  </div>
  <div class="rat-dead-text">
    <h1>{$rat?.name} is dead</h1>
  </div>
  <div class="button-container">
    <BigButton text="OK" onclick={onClick} />
  </div>
</div>

<style lang="scss">
  .rat-dead {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    position: relative;
    width: 100%;
    background-image: url("/images/texture-2.png");
    background-size: 200px;

    .rat-dead-image {
      width: 100px;
      height: 100px;

      img {
        width: 100%;
        height: 100%;
        object-fit: contain;
      }
    }

    .button-container {
      overflow: hidden;
      width: 80%;
      display: flex;
      justify-content: center;
      align-items: center;
    }
  }
</style>
