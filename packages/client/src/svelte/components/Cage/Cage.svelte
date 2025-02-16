<script lang="ts">
  import { T, useTask, useThrelte } from "@threlte/core"
  import { Spring } from "svelte/motion"
  import { OrbitControls } from "@threlte/extras"
  import Rat from "../World/Models/RatAnimated.svelte"
  import Lighting from "@components/World/Lighting/Lighting.svelte"
  import Performance from "@components/World/Stats/Performance.svelte"
  import CustomRenderer from "../World/CustomRenderer/CustomRenderer.svelte"

  export let cameraPosition: [number, number, number] = [15, 1, 0]
  export let cameraLookAt: [number, number, number] = [0, 0, 0]

  const { renderStage, renderer } = useThrelte()

  const scan = new Spring(2, { stiffness: 0.1, damping: 10 })

  console.log("cameraLookAt", cameraLookAt)
  console.log(cameraLookAt)

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

<Performance {renderer} />

<T.PerspectiveCamera
  oncreate={ref => {
    ref.lookAt(...cameraLookAt)
  }}
  fov={50}
  makeDefault
  position={cameraPosition}
>
  <OrbitControls />
</T.PerspectiveCamera>

<Lighting />

<CustomRenderer
  effects={{
    crt: { warp: 0.1, scan: scan.current },
    fishEye: {
      horizontalFOV: 50,
      strength: 0.5,
      cylindricalRatio: 2,
    },
  }}
/>

<Rat />
