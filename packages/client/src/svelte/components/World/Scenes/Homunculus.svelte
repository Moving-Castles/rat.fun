<script lang="ts">
  import { T, useThrelte } from "@threlte/core"
  import { OrbitControls } from "@threlte/extras"
  import Lighting from "@components/World/Lighting/Lighting.svelte"
  import Homunc from "@components/World/Models/Homunc.svelte"
  import Performance from "@components/World/Stats/Performance.svelte"
  import CustomRenderer from "@components/World/CustomRenderer/CustomRenderer.svelte"

  const { renderer } = useThrelte()

  const config = {
    lighting: {
      fogColor: 0x000000,
      ambientLightColor: 0xffffff,
      ambientLightIntensity: 1,
    },
    effects: {
      crt: {
        scan: 2,
        warp: 0,
      },
    },
  }
</script>

<Performance {renderer} />

<T.PerspectiveCamera
  on:create={({ ref }) => {
    ref.lookAt(0, 0, 0)
  }}
  fov={45}
  makeDefault
  position={[-2, 4, 6]}
>
  <OrbitControls />
</T.PerspectiveCamera>

<Lighting {...config.lighting} />

<Homunc>
  <T.Mesh slot="fallback">
    <T.BoxGeometry args={[1, 1, 10, 10]}></T.BoxGeometry>
    <T.MeshBasicMaterial color={0xff00f0} />
  </T.Mesh>
</Homunc>

<CustomRenderer effects={config.effects} />
