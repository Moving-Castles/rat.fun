<script lang="ts">
  import { goto } from "$app/navigation"
  import { fly, fade } from "svelte/transition"
  import { page } from "$app/state"
  import { player } from "$lib/modules/state/stores"

  import SEO from "$lib/components/Shared/SEO/SEO.svelte"
  import { Admin } from "$lib/components/Admin"

  let { children }: { children?: any } = $props()

  // Redirect to game route if player is not authorized to view admin page
  $effect(() => {
    if ($player) {
      if (!$player.masterKey) {
        if (page.route.id === "/(main)/admin/[tripId]") {
          goto(`/${page.params.tripId}`)
        } else {
          goto("/")
        }
      }
    }
  })
</script>

<SEO prependTitle="ADMIN" />

<Admin />

{#if page.route.id !== "/(main)/admin"}
  <div
    in:fly|global={{ x: -800, opacity: 1, duration: 200 }}
    out:fly|global={{ x: -800, opacity: 1, duration: 200 }}
    class="sidebar open"
  >
    {@render children?.()}
  </div>
{/if}

<style lang="scss">
  .sidebar {
    position: fixed;
    height: calc(var(--game-window-main-height) + 1px); // To overlap the topbar border
    width: 50%;
    min-width: 600px;
    overflow-x: hidden;
    z-index: 999;
    top: 58px; // To overlap the topbar border
    left: 0;
    background: black;
    transform: translate(-100%, 0);
    transition: transform 0.2s ease;
    border: 1px solid var(--color-grey-mid);
    &.open {
      transform: translate(0, 0);
    }
  }
</style>
