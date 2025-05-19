<script lang="ts">
  import { fly } from "svelte/transition"
  let { value = $bindable(), prepend = "" } = $props()

  // Get the new value
  const SIZE = 8

  let animValue = $state(Number(value))
  let direction = $state(0)

  const set = (newValue: number) => {
    direction = Math.sign(newValue - animValue)
    console.log("direction")
    console.log(direction)
    console.log(newValue - animValue)
    animValue = newValue
    console.log("setting")
  }

  $effect(() => {
    set(Number(value))
  })

  // const addOne = () => set(animValue + 10)
  // const subtractOne = () => set(animValue - 10)
</script>

{#key animValue}
  <div class="value">
    {prepend}
    <div
      in:fly={{ delay: 150, duration: 150, y: direction * SIZE }}
      out:fly={{ duration: 150, y: direction * SIZE }}
      class="value"
    >
      {animValue}
    </div>

    <!-- <button onclick={addOne}>+1</button>
    <button onclick={subtractOne}>-1</button> -->
  </div>
{/key}

<style>
  .value {
    display: inline-flex;
    overflow: hidden;
  }
</style>
