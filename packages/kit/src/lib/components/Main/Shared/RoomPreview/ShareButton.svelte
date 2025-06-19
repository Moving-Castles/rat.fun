<script lang="ts">
  import type { Hex } from "viem"

  import { clickToCopy } from "$lib/modules/utils"

  let { roomId }: { roomId: Hex } = $props()

  let shareText = $state<"Share" | "Copied" | "Failed">("Share")

  let oncopysuccess = () => {
    shareText = "Copied"
    setTimeout(() => {
      shareText = "Share"
    }, 3000)
  }

  let oncopyfail = () => {
    shareText = "Failed"
    setTimeout(() => {
      shareText = "Share"
    }, 3000)
  }

  let copyShareLink = $derived(
    `${window.location.protocol + "//" + window.location.host + window.location.pathname}#${roomId}`
  )
</script>

<button
  class="share-button"
  use:clickToCopy={copyShareLink}
  {oncopysuccess}
  {oncopyfail}
  class:success={shareText === "Copied"}
  class:failed={shareText === "Failed"}
>
  {shareText}
</button>

<style lang="scss">
  .share-button {
    background: var(--color-alert);
    color: var(--white);
    width: auto;
    padding: 5px;
    margin: 0;

    &.success {
      background: var(--color-alert-priority);
    }
    &.failed {
      background: var(--color-death);
    }
  }

  .share-button {
    display: inline-block;
    padding: 0;
    margin: 0;
  }
</style>
