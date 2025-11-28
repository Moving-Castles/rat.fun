<script lang="ts">
  import { page } from "$app/state"
  import { playSound } from "$lib/modules/sound"
  import { shaderManager } from "$lib/modules/webgl/shaders/index.svelte"
  import { goto } from "$app/navigation"
  import { Tooltip } from "$lib/components/Shared"
  import { UI_STRINGS } from "$lib/modules/ui/ui-strings/index.svelte"

  import ModeSwitchButton from "../Buttons/ModeSwitchButton.svelte"

  let { isAdminView }: { isAdminView: boolean } = $props()

  const enterAdmin = () => {
    playSound({ category: "ratfunTransitions", id: "adminEnter" })
    shaderManager.setShader("black")
    goto("/cashboard")
  }

  const exitAdmin = () => {
    playSound({ category: "ratfunTransitions", id: "adminExit" })
    shaderManager.setShader("clouds", true)
    goto(page.route.id?.includes("tripId") ? "/" + page.params.tripId : "/")
  }
</script>

<div class="mode-switch">
  <Tooltip content={UI_STRINGS.adminInstruction(500)}>
    <ModeSwitchButton {isAdminView} onclick={isAdminView ? exitAdmin : enterAdmin} />
  </Tooltip>
</div>

<style lang="scss">
  .mode-switch {
    width: 160px;
    height: 100%;
  }
</style>
