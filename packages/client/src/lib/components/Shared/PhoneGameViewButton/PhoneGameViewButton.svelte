<script lang="ts">
  import { phoneActiveGameView } from "$lib/modules/ui/state.svelte"
  import { BigButton } from "$lib/components/Shared"
  import { strings } from "$lib/modules/strings"

  let { targetView }: { targetView: "ratbox" | "triplisting" } = $props()

  function switchView() {
    phoneActiveGameView.set(targetView)
  }

  const buttonText = $derived(
    targetView === "ratbox" ? `← ${strings.rat.toUpperCase()}` : `${strings.trips.toUpperCase()} →`
  )
</script>

<div class="phone-view-button-container">
  <BigButton text={buttonText} onclick={switchView} />
</div>

<style lang="scss">
  .phone-view-button-container {
    height: 120px;
    width: 100%;
    border-top: var(--default-border-style);
    background: var(--background-semi-transparent);
    padding: 10px;
    flex-shrink: 0;
  }
</style>
