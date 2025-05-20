<script lang="ts">
  import { Tween } from "svelte/motion"
  import { linear as easing } from "svelte/easing"
  import { playSound } from "@svelte/modules/sound"

  let {
    value,
    goal = Infinity,
    warn = -1,
    step = 10,
    muted = false,
    going = $bindable(false),
  } = $props()
  // export let value: number
  // export let goal = Infinity // optional
  // export let warn = -1 // If the value falls below this number, give ominous warning
  // export let step = 10

  const DURATION = 1000

  let emphasis = $state("")
  let direction = $state(0)

  const goingUp = new Tween(Number(value), { duration: DURATION, easing })

  let previousValue = goingUp.current

  $effect(() => {
    if (goingUp.current !== Number(value) && !going) {
      direction = previousValue - goingUp.current
      previousValue = goingUp.current
      goingUp.set(Number(value))
      going = true

      let interval = setInterval(() => {
        if (direction < 0) {
          if (!muted) {
            playSound("tcm", "bugsUp", false, false, 0.5)
          }
        } else {
          if (!muted) {
            playSound("tcm", "bugsUp")
          }
        }
      }, 70)

      setTimeout(() => {
        if (direction <= 0) {
          emphasis = "emphasis-failure"
        } else {
          emphasis = "emphasis-success"
        }

        if (direction < 0) {
          console.log(direction)
          if (!muted) {
            playSound("tcm", "ratsDown")
          }
        } else {
          console.log(direction)
          if (!muted) {
            playSound("tcm", "ratsUp")
          }
        }

        clearInterval(interval)

        setTimeout(() => {
          emphasis = ""
          going = false
          direction = 0
        }, 3000)
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
