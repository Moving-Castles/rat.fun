<script lang="ts">
  import { cubicIn } from "svelte/easing"
  import { T, useThrelte } from "@threlte/core"
  import { Tween } from "svelte/motion"
  import { Fog } from "three"
  import CustomRenderer from "@components/3D/World/CustomRenderer/CustomRenderer.svelte"
  import Rat from "@components/3D/World/Models/RatAnimatedMoving.svelte"

  const { scene } = useThrelte()

  let { animations } = $props()

  let cameraZ = new Tween(10, { duration: 20000, easing: cubicIn })

  cameraZ.set(100)
  scene.fog = new Fog(0xffffff, 0, 35)

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
  position.y={-1 +
    animations.positionY.current -
    animations.positionYOffset.current}
  position.z={animations.positionZ.current}
  position.x={0}
  rotation.z={0}
  rotation.x={animations.moving.current / 10}
></Rat>

<!-- DOOR L -->
<T.Mesh
  receiveShadow
  position.y={animations.positionY.current - animations.positionYOffset.current}
  position.x={-2 + animations.doorProgress.current}
>
  <T.BoxGeometry args={[2, 5, 0.2]} />
  <T.MeshBasicMaterial />
</T.Mesh>
<T.Mesh
  receiveShadow
  position.y={animations.positionY.current - animations.positionYOffset.current}
  position.x={2 - animations.doorProgress.current}
>
  <T.BoxGeometry args={[2, 5, 0.2]} />
  <T.MeshBasicMaterial />
</T.Mesh>
<!-- LEFT AND RIGHT WALLS -->
<T.Mesh
  receiveShadow
  position.y={animations.positionY.current - animations.positionYOffset.current}
  position.x={2}
  position.z={-2}
>
  <T.BoxGeometry args={[0.2, 5, 4]} />
  <T.MeshBasicMaterial color={0xdddddd} />
</T.Mesh>
<T.Mesh
  receiveShadow
  position.y={animations.positionY.current - animations.positionYOffset.current}
  position.x={-2}
  position.z={-2}
>
  <T.BoxGeometry args={[0.2, 5, 4]} />
  <T.MeshBasicMaterial color={0xdddddd} />
</T.Mesh>

<!-- BACK WALL -->
<T.Mesh
  receiveShadow
  position.y={animations.positionY.current - animations.positionYOffset.current}
  position.x={0}
  position.z={-4}
>
  <T.BoxGeometry args={[4, 5, 0.2]} />
  <T.MeshBasicMaterial color={0xaaaaaa} />
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
    color={0xffffff}
    intensity={20}
    castShadow
    angle={Math.PI + Math.PI / 2}
    penumbra={20}
    decay={0.1}
    distance={15}
  /></T.PerspectiveCamera
>
<T.Mesh rotation.x={-Math.PI / 2} receiveShadow>
  <T.PlaneGeometry args={[22, 22, 10, 10]} />
  <T.MeshStandardMaterial color={0xeeeeee} side={2} />
</T.Mesh>

<T.AmbientLight intensity={0.4} />
