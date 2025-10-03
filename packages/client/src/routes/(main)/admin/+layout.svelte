<script lang="ts">
  import { goto } from "$app/navigation"
  import { fly } from "svelte/transition"
  import { page } from "$app/state"
  import { player } from "$lib/modules/state/stores"
  import SEO from "$lib/components/Shared/SEO/SEO.svelte"
  import {
    AdminTripMonitor,
    AdminPastTripsMonitor,
    AdminTripTable,
    AdminPastTripTable
  } from "$lib/components/Admin"

  let { children }: { children?: any } = $props()

  let focus = $state("")

  // Redirect to game route if player is not authorized to view admin page
  $effect(() => {
    if ($player) {
      if (!$player.masterKey) {
        if (page.route.id === "/(main)/admin/[roomId]") {
          goto(`/${page.params.roomId}`)
        } else {
          goto("/")
        }
      }
    }
  })
</script>

<SEO prependTitle="ADMIN" />

<div class="span-all">
  <div class="">
    <div class="">
      <AdminTripMonitor {focus} />
      <AdminTripTable bind:focus />
      <AdminPastTripsMonitor />
      <AdminPastTripTable />
    </div>
  </div>
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

  .create-room-button {
    width: 100%;
    height: 80px;
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
