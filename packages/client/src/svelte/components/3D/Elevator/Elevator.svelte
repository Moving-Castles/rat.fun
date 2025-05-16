<script lang="ts">
  import { cubicIn } from "svelte/easing"
  import { T } from "@threlte/core"
  import { Tween } from "svelte/motion"
  import CustomRenderer from "@components/3D/World/CustomRenderer/CustomRenderer.svelte"
  import Rat from "@components/3D/World/Models/RatAnimatedMoving.svelte"

  let { animations } = $props()

  let cameraZ = new Tween(10, { duration: 60000, easing: cubicIn })

  cameraZ.set(100)

  import { Object3D } from "three"
</script>

<CustomRenderer
  effects={{
    godotFishEye: true,
    crt: {
      scan: 2,
      warp: 1,
    },
    grayscale: true,
  }}
/>

<Rat
  moving={animations.moving}
  scale={2}
  rotation.y={animations.rotationY.current}
  position.y={-0.5 - animations.positionY.current}
  position.z={0}
  position.x={0}
  rotation.z={0}
  rotation.x={animations.moving.current / 10}
></Rat>

<!-- DOOR L -->
<T.Mesh>
  <T.BoxGeometry />
</T.Mesh>

<T.PerspectiveCamera
  oncreate={r => r.lookAt(0, 0, 0)}
  fov={50}
  makeDefault
  position={[0, 0, cameraZ.current]}
>
  <!-- <OrbitControls /> -->
  <T.SpotLight
    target={(() => {
      const t = new Object3D()
      t.position.set(0, 0, -1)
      return t
    })()}
    color={0xc0daa4}
    intensity={10}
    castShadow
    angle={Math.PI + Math.PI / 2}
    penumbra={20}
    decay={0.1}
    distance={50}
  /></T.PerspectiveCamera
>
<T.Mesh rotation.x={-Math.PI / 2} receiveShadow>
  <T.PlaneGeometry args={[22, 22, 10, 10]} />
  <T.MeshStandardMaterial color={0xeeeeee} side={2} />
</T.Mesh>

<T.AmbientLight intensity={0.4} />
