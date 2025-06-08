<script lang="ts">
  import { onMount, onDestroy } from "svelte"

  let spinnerChars = ["/", "-", "\\", "|"]
  let currentIndex = 0
  let interval: ReturnType<typeof setInterval>

  onMount(() => {
    interval = setInterval(() => {
      currentIndex = (currentIndex + 1) % spinnerChars.length
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
    font-family: monospace;
  }
</style>
