<script lang="ts">
  import { SmallSpinner as BaseSmallSpinner } from "@ratfun/shared-ui/Loaders"
  import { playSound } from "$lib/modules/sound"

  let { soundOn = false }: { soundOn?: boolean } = $props()

  function onTick() {
    playSound({ category: "ratfunUI", id: "tick" })
  }
</script>

<BaseSmallSpinner {soundOn} playSound={onTick} />
