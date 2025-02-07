<script lang="ts">
  import { onDestroy } from "svelte"

  import { T, useTask, useThrelte } from "@threlte/core"
  import { OrbitControls, interactivity } from "@threlte/extras"

  // import Lighting from "@components/World/Lighting/Lighting.svelte"
  import CustomRenderer from "../CustomRenderer/CustomRenderer.svelte"

  const config = {
    lighting: {
      fogColor: 0xf0f0f0,
      ambientLightColor: 0xffffff,
      ambientLightIntensity: 0.9,
      directionalLightColor: 0xf0ffff,
      directionalLightIntensity: 0.2,
    },
    effects: {
      rgbShift: false,
      bloom: {
        strength: 1.2,
        threshold: 0.2,
        radius: 0.2,
      },
      crt: {
        scan: 1,
        warp: 1,
      },
    },
  }

  let intensity = 10
  let intensityTime = 0

  useTask("heartbeat", d => {
    intensityTime += d
    intensity = Math.sin(intensityTime + d)
  })

  interactivity({
    filter: hits => {
      // only return first hit, we don't care about more than that
      return hits.slice(0, 1)
    },
  })

  onDestroy(() => {
    // console.log("exit pointer lock to access it in html")
  })
</script>

<T.PerspectiveCamera
  on:create={({ ref }) => {
    ref.lookAt(0, 0, 0)
  }}
  makeDefault
  position={[0, 100, 100]}
>
  <OrbitControls />
</T.PerspectiveCamera>

<T.Mesh receiveShadow castShadow>
  <T.SphereGeometry args={[10, 40, 20]} />
  <T.MeshBasicMaterial color={0xeeccdd} />
</T.Mesh>

<!-- <Lighting
  fogColor={config.lighting.fogColor}
  ambientLightColor={config.lighting.ambientLightColor}
  ambientLightIntensity={config.lighting.ambientLightIntensity}
  directionalLightColor={config.lighting.directionalLightColor}
  directionalLightIntensity={config.lighting.directionalLightIntensity}
/> -->

<CustomRenderer effects={config.effects} />
