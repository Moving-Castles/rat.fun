<script lang="ts">
  import "../app.css"
  import "tippy.js/dist/tippy.css"
  import "tippy.js/dist/backdrop.css"
  import "tippy.js/animations/shift-away.css"
  import { ENVIRONMENT } from "$lib/mud/enums"

  import Introduction from "$lib/components/Spawn/Introduction/Introduction.svelte"

  import type { LayoutProps, Snapshot } from "./$types"
  import { Tween } from "svelte/motion"
  import { initializeSentry } from "$lib/modules/error-handling"
  import { browser } from "$app/environment"
  import { goto } from "$app/navigation"
  import { initStaticContent } from "$lib/modules/content"
  import { publicNetwork } from "$lib/modules/network"
  import { UIState } from "$lib/modules/ui/state.svelte"
  import { UI } from "$lib/modules/ui/enums"
  import { errorHandler } from "$lib/modules/error-handling"
  import { BigButton } from "$lib/components/Shared"
  import {
    environment as environmentStore,
    walletType as walletTypeStore
  } from "$lib/modules/network"

  import Loading from "$lib/components/Loading/Loading.svelte"
  import Toasts from "$lib/components/Shared/Toasts/Toasts.svelte"

  let height = new Tween(20, { duration: 200 })

  let { children }: LayoutProps = $props()

  // Called when loading is complete
  const loaded = async () => {
    try {
      // Get content from CMS
      // We do not wait, for faster loading time...
      initStaticContent($publicNetwork.worldAddress)
      // Loading done. Set the UI state to ready
      UIState.set(UI.READY)
    } catch (error) {
      errorHandler(error) // CMS error
      goto("/")
    }
  }

  // Initialize Sentry
  if (browser && !import.meta.env.DEV) {
    initializeSentry()
  }

  let environmentOptions = $state(
    ["development", "base-sepolia", "base"].sort((a, b) => (a === $environmentStore ? -1 : 1))
  )
</script>

<svelte:window
  onscroll={e => {
    if (window.scrollY > 1) {
      height.set(20)
    } else {
      // height.set(window.innerHeight / 2)
    }
  }}
/>

{#if $UIState === UI.LOADING}
  <Loading
    environment={$environmentStore}
    loaded={() => {
      loaded()
    }}
  />
{:else}
  <div class="context-main">
    <header style:height="{height.current}px" class="menu">
      <div>
        {#if height.current > 40}
          <Introduction height={height.current} />
        {:else}
          <div>
            <a href="/"> rat.fun </a>
            <select
              bind:value={$environmentStore}
              onchange={() => {
                console.log("switch environments", $environmentStore)
                window.location.href = `/?network=${$environmentStore}`
                // UIState.set(UI.LOADING)
              }}
            >
              {#each environmentOptions as option}
                <option value={option}>
                  {option}
                </option>
              {/each}
            </select>
          </div>
        {/if}
      </div>
      <div class="play-link">
        {#if height.current > 40}
          <BigButton
            onclick={() => {
              window.location.href = "https://rat.fun"
            }}
            text="Play"
          />
        {:else}
          <a href="https://rat.fun" target="_blank"> Play </a>
        {/if}
      </div>
      <!-- <a class="" href="https://rat.fun" target="_blank"> Play </a> -->
    </header>
    <div class="content">
      {@render children?.()}
    </div>
  </div>
{/if}

<Toasts />

<style lang="scss">
  .context-main {
    // display: none;
    width: 100vw;
  }

  .menu {
    padding: 4px;
    display: flex;
    justify-content: space-between;

    .play-link {
      width: 400px;
      text-align: right;
    }
  }

  .content {
    // padding: 0 4px;
  }

  .menu {
    // position: sticky;
    // top: 0;
    // left: 0;
    font-weight: bold;
  }
</style>
