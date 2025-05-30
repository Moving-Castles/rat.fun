<script lang="ts">
  import { onMount } from "svelte"
  import { T, useThrelte } from "@threlte/core"
  import { interactivity } from "@threlte/extras"
  import Rat from "@components/3D/World/Models/RatAnimatedMoving.svelte"
  import { getBoxState } from "./state.svelte"

  import { Object3D, Fog } from "three"

  const { scene } = useThrelte()

  let { box } = getBoxState()

  scene.fog = new Fog(0x3d3d3d, 10, 20)

  interactivity()

  onMount(box.pickTarget)
</script>

<Rat
  scale={2}
  moving={box.movingSpeed}
  rotation.y={box.rotationY.current - Math.PI / 2}
  position.x={box.target.current.x}
  position.y={0.001}
  position.z={box.target.current.z}
  {getBoxState}
></Rat>

<T.PerspectiveCamera
  oncreate={r => r.lookAt(0, 0, 0)}
  fov={50}
  makeDefault
  position={[6, 2, 6]}
>
  <!-- <OrbitControls /> -->
  <T.SpotLight
    target={(() => {
      const t = new Object3D()
      t.position.set(0, 0, -1)
      return t
    })()}
    color={0x3d3d3d}
    intensity={10}
    castShadow
    angle={Math.PI + Math.PI / 2}
    penumbra={4}
    decay={0.1}
    distance={20}
  /></T.PerspectiveCamera
>

<T.Mesh>
  <T.BoxGeometry args={[100, 100, 100]} />
  <T.MeshBasicMaterial side={1} color={0x000000} />
</T.Mesh>

<T.Mesh rotation.x={-Math.PI / 2} receiveShadow castShadow>
  <T.PlaneGeometry args={[200, 200, 10, 10]} />
  <T.MeshStandardMaterial color={0x3d3d3d} side={2} />
</T.Mesh>

<T.AmbientLight color={0x3d3d3d} intensity={1} />
