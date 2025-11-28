<script lang="ts">
  import { onMount } from "svelte"
  import { page } from "$app/state"
  import { initPublicNetwork } from "$lib/initPublicNetwork"
  import { initEntities } from "$lib/modules/chain-sync/initEntities"
  import { blockNumber, loadingMessage, loadingPercentage, ready } from "$lib/modules/network"
  import { ENVIRONMENT } from "$lib/mud/enums"

  const {
    environment,
    loaded = () => {}
  }: {
    environment: ENVIRONMENT
    loaded: () => void
  } = $props()

  // Wait for both chain sync and minimum duration to complete
  $effect(() => {
    if ($ready) {
      // Initialise and synchronise onchain entities with Svelte
      initEntities()

      setTimeout(() => {
        // Return
        loaded()
      }, 1000)
    }
  })

  onMount(async () => {
    // This sets up the public network and listens to the SyncProgress component
    // When sync is complete, the ready store is set to true
    // We listen to for this in the $effect above
    await initPublicNetwork(environment, page.url)
  })
</script>

<div class="loading">
  <div class="status-box">
    <table>
      <tbody>
        <tr>
          <td class="label">BlockNumber:</td>
          <td>{$blockNumber}</td>
        </tr>
        <tr>
          <td class="label">Message:</td>
          <td>{$loadingMessage}</td>
        </tr>
        <tr>
          <td class="label">Loading:</td>
          <td>{$loadingPercentage}%</td>
        </tr>
        <tr>
          <td class="label">Ready?</td>
          <td>{$ready}</td>
        </tr>
      </tbody>
    </table>
  </div>
</div>

<style lang="scss">
  .loading {
    position: fixed;
    top: 0;
    left: 0;
    color: var(--foreground);
    font-size: var(--font-size-normal);
    width: 100dvw;
    height: 100dvh;
    z-index: var(--z-top);
    display: flex;
    justify-content: center;
    align-items: center;

    .status-box {
      width: 600px;
      padding: 1rem;
      background-color: #f5f5f5;
      border: 1px solid #ccc;
      font-size: var(--font-size-normal);
      color: var(--foreground);

      table {
        width: 100%;
        border-collapse: collapse;
        border-spacing: 0;
      }

      td {
        padding: 0.25rem;
        border: 1px solid #ccc;
        text-align: left;
        overflow: hidden;
        text-overflow: ellipsis;
        word-break: break-word;
        white-space: nowrap;
        max-width: 0;
        color: black;

        &.label {
          font-weight: bold;
        }
      }

      tr:nth-child(even) {
        background-color: white;
      }

      tr:nth-child(odd) {
        background-color: #f9f9f9;
      }
    }
  }
</style>
