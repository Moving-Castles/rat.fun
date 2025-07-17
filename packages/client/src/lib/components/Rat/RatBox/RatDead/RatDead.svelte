<script lang="ts">
  import { rat } from "$lib/modules/state/base/stores"
  import { ratImageUrl } from "$lib/modules/state/base/stores"
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
  <BigButton text="OK" onclick={onClick} />
</div>
