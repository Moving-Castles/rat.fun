<script lang="ts">
  import { page } from "$app/state"
  import { playSound } from "$lib/modules/sound"
  import { shaderManager } from "$lib/modules/webgl/shaders/index.svelte"
  import { goto } from "$app/navigation"
  import { Tooltip } from "$lib/components/Shared"
  import { UI_STRINGS } from "$lib/modules/ui/ui-strings/index.svelte"
  import { player } from "$lib/modules/state/stores"

  import ModeSwitchButton from "../Buttons/ModeSwitchButton.svelte"

  let { isAdminView }: { isAdminView: boolean } = $props()

  const enterAdmin = () => {
    playSound({ category: "ratfunTransitions", id: "adminEnter" })
    shaderManager.setShader("black")
    goto("/trips-lab")
  }

  const exitAdmin = () => {
    playSound({ category: "ratfunTransitions", id: "adminExit" })
    shaderManager.setShader("clouds", true)
    goto(page.route.id?.includes("tripId") ? "/" + page.params.tripId : "/")
  }

  // Only show tooltip when admin is not unlocked and not in admin view
  const showTooltip = $derived(!$player?.masterKey && !isAdminView)
</script>

<div class="mode-switch" data-tutorial="mode-switch">
  <Tooltip allowHTML content={showTooltip ? UI_STRINGS.adminInstruction(500) : undefined}>
    <ModeSwitchButton {isAdminView} onclick={isAdminView ? exitAdmin : enterAdmin} />
  </Tooltip>
</div>

<style lang="scss">
  .mode-switch {
    width: 160px;
    height: 100%;
    background: var(--color-grey-light);

    @media (max-width: 800px) {
      flex: 1;
      width: auto;
    }
  }
</style>
