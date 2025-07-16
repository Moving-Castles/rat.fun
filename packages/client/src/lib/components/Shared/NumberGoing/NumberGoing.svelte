<script lang="ts">
  import { Tween } from "svelte/motion"
  import { linear as easing } from "svelte/easing"
  import { playSound } from "$lib/modules/sound"

  let {
    value,
    goal = Infinity,
    warn = -1,
    step = 10,
    muted = false,
    going = $bindable(false)
  } = $props()

  const DURATION = 500

  let emphasis = $state("")
  let direction = $state(0)

  const goingUp = new Tween(Number(value), { duration: DURATION, easing })

  let previousValue = $state(goingUp.current)

  $effect(() => {
    direction = Math.sign(goingUp.target - goingUp.current)
  })

  $effect(() => {
    going = direction !== 0
  })

  $effect(() => {
    if (!going) {
      previousValue = goingUp.current
      goingUp.set(Number(value))

      setTimeout(() => {
        if (direction <= 0) {
          emphasis = "emphasis-failure"
        } else {
          emphasis = "emphasis-success"
        }

        if (direction < 0) {
          if (!muted) {
            // playSound("tcm", "ratsUp")
          }
        } else {
          if (!muted) {
            // playSound("tcm", "ratsDown")
          }
        }

        // clearInterval(interval)

        setTimeout(() => {
          emphasis = ""
          direction = 0
        }, 2000)
      }, DURATION)
    }
  })
</script>

<span
  class={emphasis}
  class:flash-slow-thrice={goingUp.current === warn ||
    (goingUp.current % step === 0 && goingUp.current < warn)}
  class:flash-fast-thrice={goingUp.current >= goal}
>
  <span class="arrow">
    {#if direction < 0}↓{:else if direction > 0}↑{/if}
  </span>
  {Math.round(goingUp.current)}
</span>

<style lang="scss">
  .arrow {
    position: relative;
    top: -2px;
    left: 8px;
    width: 0.5ch;
  }
</style>
