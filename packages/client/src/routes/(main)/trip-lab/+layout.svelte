<script lang="ts">
  import { fly } from "svelte/transition"
  import { page } from "$app/state"
  // import { player } from "$lib/modules/state/stores"
  // import { goto } from "$app/navigation"

  import SEO from "$lib/components/Shared/SEO/SEO.svelte"
  import { Admin } from "$lib/components/Admin"

  let { children }: { children?: any } = $props()
</script>

<SEO prependTitle="TRIP LAB" />

<Admin />

{#if page.route.id !== "/(main)/trip-lab"}
  <div in:fly|global={{ x: -800, opacity: 1, duration: 200 }} class="sidebar open">
    {@render children?.()}
  </div>
{/if}

<style lang="scss">
  .sidebar {
    position: fixed;
    height: calc(var(--game-window-main-height) + 1px); // To overlap the topbar border
    width: 100%;
    overflow-x: hidden;
    z-index: 999;
    top: 58px; // To overlap the topbar border
    left: 0;
    background: var(--background);
    transform: translate(-100%, 0);
    transition: transform 0.2s ease;
    border: 1px solid var(--color-grey-mid);

    @media screen and (max-width: 800px) {
      top: calc(var(--top-bar-total-height-phone) - 1px);
      height: calc(var(--game-window-height) - var(--top-bar-total-height-phone));
    }

    @media screen and (min-width: 800px) {
      min-width: 600px;
      max-width: calc(var(--game-window-width) / 2);
      // width: 600px;
    }
    &.open {
      transform: translate(0, 0);
    }
  }
</style>
