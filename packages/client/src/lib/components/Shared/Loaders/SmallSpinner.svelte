<script lang="ts">
  import { playSound } from "$lib/modules/sound"
  import { onMount, onDestroy } from "svelte"

  let { soundOn = false }: { soundOn?: boolean } = $props()

  let spinnerChars = ["/", "-", "\\", "|"]
  let currentIndex = $state(0)
  let interval: ReturnType<typeof setInterval>

  onMount(() => {
    interval = setInterval(() => {
      currentIndex = (currentIndex + 1) % spinnerChars.length
      if (soundOn) {
        playSound({ category: "ratfunUI", id: "tick" })
      }
    }, 100)
  })

  onDestroy(() => {
    if (interval) clearInterval(interval)
  })
</script>

<span class="spinner">{spinnerChars[currentIndex]}</span>

<style>
  .spinner {
    display: inline-block;
    font-family: var(--typewriter-font-stack);
  }
</style>
