<script lang="ts">
  import { player } from "@modules/state/base/stores"
  import { ENVIRONMENT } from "@mud/enums"
  import { initOffChainSync } from "@modules/off-chain-sync"

  import { UILocation } from "@modules/ui/stores"
  import { LOCATION } from "@modules/ui/enums"
  import { walletNetwork } from "@modules/network"

  import NestView from "@components/Nest/NestView/NestView.svelte"
  import Admin from "@components/Admin/Admin.svelte"
  import RatStats from "@components/Nest/RatStats.svelte"
  import OperatorStats from "@components/Nest/OperatorStats.svelte"
  import Chat from "@components/Chat/Chat.svelte"

  export let environment: ENVIRONMENT

  // Wait for the player to have a rat before initializing off-chain sync
  $: if ($player.ownedRat) {
    initOffChainSync(environment, $player.ownedRat)
  }
</script>

<Admin />
<Chat {environment} walletNetwork={$walletNetwork} />

<div class="nest">
  <!-- NEST VIEW -->
  <div class="nest-view">
    <NestView />
  </div>
  <!-- RAT STATS -->
  <RatStats />
  <!-- OPERATOR STATS -->
  <OperatorStats />
  <!-- LOBBY LINK -->
  <div class="lobby-link">
    <button on:click={() => UILocation.set(LOCATION.LOBBY)}>GO TO LOBBY</button>
  </div>
</div>

<style lang="scss">
  .nest-view {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }

  .lobby-link {
    position: fixed;
    bottom: 20px;
    right: 20px;
    button {
      padding: 20px;
      font-size: 48px;
    }
  }
</style>
