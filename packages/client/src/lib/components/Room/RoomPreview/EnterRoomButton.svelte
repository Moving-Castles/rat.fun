<script lang="ts">
  import type { Hex } from "viem"
  import { playSound } from "$lib/modules/sound"
  import { sessionId } from "$lib/modules/ui/state.svelte"
  import { goto } from "$app/navigation"
  import { getEnvironment } from "$lib/modules/network"
  import { v4 as uuid } from "uuid"
  import { ENVIRONMENT, WALLET_TYPE } from "$lib/mud/enums"
  import { busy } from "$lib/modules/action-manager/index.svelte"

  import { BigButton } from "$lib/components/Shared"

  let { roomId, disabled }: { roomId: Hex; disabled: boolean } = $props()

  const onClick = async () => {
    const environment = getEnvironment()
    sessionId.set(uuid())
    playSound("ratfun", "enteredPod")
    goto(
      `/${roomId}/enter?sessionId=${$sessionId}${environment === ENVIRONMENT.BASE_SEPOLIA ? "&entrykit&sepolia" : ""}`
    )
  }
</script>

<div class="room-enter">
  <BigButton {disabled} text="Send rat to room" onclick={onClick} />
</div>

<style>
  .room-enter {
    display: block;
    height: 90px;
  }
</style>
