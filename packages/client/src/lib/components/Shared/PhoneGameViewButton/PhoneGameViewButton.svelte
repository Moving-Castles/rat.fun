<script lang="ts">
  import { phoneActiveGameView } from "$lib/modules/ui/state.svelte"
  import { SlideToggle } from "$lib/components/Shared"
  import { UI_STRINGS } from "$lib/modules/ui/ui-strings/index.svelte"

  const options = [
    { value: "ratbox", label: UI_STRINGS.rat.toUpperCase() },
    { value: "triplisting", label: UI_STRINGS.trips.toUpperCase() }
  ]
</script>

<div class="phone-view-button-container" data-tutorial="phone-trip-button">
  <SlideToggle
    {options}
    value={$phoneActiveGameView}
    onchange={v => phoneActiveGameView.set(v as "ratbox" | "triplisting")}
  />
</div>

<style lang="scss">
  .phone-view-button-container {
    width: 100%;
    height: var(--phone-slide-toggle-height);
    flex-shrink: 0;
  }
</style>
