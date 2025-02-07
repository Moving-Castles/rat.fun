<script lang="ts">
  import { T, useTask, useThrelte } from "@threlte/core"
  import { Spring } from "svelte/motion"
  import { OrbitControls } from "@threlte/extras"
  import Rat from "../World/Models/Rat.svelte"
  import Lighting from "@components/World/Lighting/Lighting.svelte"
  import CustomRenderer from "../World/CustomRenderer/CustomRenderer.svelte"

  const { renderStage } = useThrelte()

  const scan = new Spring(2, { stiffness: 0.1, damping: 10 })

  useTask(
    () => {
      if (Math.random() < 0.001) {
        scan.set(20)
      } else if (scan.target === scan.current) {
        scan.set(2)
      }
    },
    { stage: renderStage }
  )
</script>

<T.PerspectiveCamera
  on:create={({ ref }) => {
    ref.lookAt(0, 0, 0)
  }}
  fov={25}
  makeDefault
  position={[15, 1, 0]}
>
  <OrbitControls />
</T.PerspectiveCamera>

<Lighting />

<CustomRenderer effects={{ crt: { warp: 0.1, scan: scan.current } }} />

<Rat />
