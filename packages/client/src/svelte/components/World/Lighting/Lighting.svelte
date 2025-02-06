<script lang="ts">
  import { T, useThrelte } from "@threlte/core"
  import { Fog } from "three"

  let fogColor: number = 0x000000
  export let ambientLightColor: number = 0xd0d0d0
  let ambientLightIntensity: number = 10
  export let directionalLightColor: number = 0xffffff
  let directionalLightIntensity: number = 0.2
  export let mapRadius: number = 500

  const { scene } = useThrelte()

  scene.fog = new Fog(fogColor, 300, 1000)
</script>

<!-- Ambient light -->
<T.AmbientLight args={[ambientLightColor, ambientLightIntensity]} />

<!-- Directional light -->
<T.DirectionalLight
  args={[directionalLightColor, directionalLightIntensity]}
  intensity={1}
  position={[0, 10, 0]}
/>
