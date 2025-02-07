<script>
  import Stats from "three/examples/jsm/libs/stats.module.js"
  import { useThrelte, useTask } from "@threlte/core"
  import { onMount } from "svelte"

  const { renderer } = useThrelte()

  const stats = new Stats()

  const init = () => {
    document.body.appendChild(stats.dom)
  }

  useTask("stats", () => {
    stats.update()
  })

  onMount(init)
</script>
