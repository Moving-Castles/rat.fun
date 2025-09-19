<script lang="ts">
  import { goto } from "$app/navigation"
  import { fly } from "svelte/transition"
  import { page } from "$app/state"
  import { player } from "$lib/modules/state/stores"
  import { PageTransitions } from "$lib/components/Shared"
  import { gameLayoutTransitionConfig } from "$lib/components/Shared/PageTransitions/transitionConfigs"
  import SEO from "$lib/components/Shared/SEO/SEO.svelte"
  import {
    AdminTripMonitor,
    AdminPastTripsMonitor,
    AdminTripTable,
    CreateRoom
  } from "$lib/components/Admin"
  import { BigButton } from "$lib/components/Shared"
  import { getModalState } from "$lib/components/Shared/Modal/state.svelte"

  let { children }: { children?: any } = $props()

  let { modal } = getModalState()

  $effect(() => {
    if ($player) {
      if (!$player.masterKey) {
        if (page.route.id === "/(rooms)/admin/[roomId]") {
          goto(`/${page.params.roomId}`)
        } else {
          goto("/")
        }
      }
    }
  })

  const startCreateRoom = () => {
    modal.set(createTrip)
  }
</script>

<div class="span-all">
  <PageTransitions config={gameLayoutTransitionConfig}>
    <div class="">
      <SEO prependTitle="ADMIN" />

      <div class="">
        <AdminTripMonitor />
        <BigButton text="Create trip" onclick={startCreateRoom} />
        <AdminTripTable />
        <AdminPastTripsMonitor />
      </div>
    </div>

    {#snippet createTrip()}
      <div class="create-room-wrapper">
        <CreateRoom ondone={modal.close} />
      </div>
    {/snippet}
  </PageTransitions>
</div>

{#if children}
  <div transition:fly|global={{ x: 600, opacity: 1 }} class="sidebar open">
    {@render children?.()}
  </div>
{/if}

<style lang="scss">
  .span-all {
    grid-column: 1/4;
    position: relative;
    overflow-x: hidden;
    overflow-y: scroll;
    height: calc(var(--game-window-height) - 60px);
    background-image: url("/images/texture-5.png");
    background-size: 200px;
  }

  .create-room-wrapper {
    width: 600px;
    z-index: 99;
  }

  .sidebar {
    position: fixed;
    height: 100dvh;
    width: 600px;
    overflow-x: hidden;
    z-index: 999;
    top: 0;
    right: 0;
    background: black;
    transform: translate(100%, 0);
    transition: transform 0.2s ease;
    border-left: 1px solid var(--color-grey-mid);
    &.open {
      transform: translate(0, 0);
    }
  }
</style>
