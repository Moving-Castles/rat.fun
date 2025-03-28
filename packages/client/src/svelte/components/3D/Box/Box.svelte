<script lang="ts">
  import { onMount } from "svelte"
  import { T } from "@threlte/core"
  import CustomRenderer from "@components/3D/World/CustomRenderer/CustomRenderer.svelte"
  import Rat from "@components/3D/World/Models/RatAnimatedMoving.svelte"
  import { getBoxState } from "./state.svelte"

  import { BoxGeometry, MeshBasicMaterial, Object3D } from "three"

  const { box } = getBoxState()

  const pickTarget = async () => {
    const [x, z] = [
      Math.floor(Math.random() * 10) - 5,
      Math.floor(Math.random() * 10) - 5,
    ]
    const [dx, dz] = [x - box.target.current.x, z - box.target.current.z]

    const distance = Math.sqrt(dx * dx + dz * dz)
    const targetAngle = Math.atan2(dx, dz)

    // Compute the shortest rotation direction
    let angleDiff = targetAngle - box.rotationY.current
    angleDiff = ((angleDiff + Math.PI) % (2 * Math.PI)) - Math.PI

    const newRotationY = box.rotationY.current + angleDiff

    box.rotationY.set(newRotationY, { duration: Math.abs(angleDiff) * 200 })

    box.movingSpeed.set(1)

    await box.target.set({ x, z }, { duration: distance * 500 })

    box.movingSpeed.set(0.2)

    setTimeout(pickTarget, 300 + Math.random() * 1000)
  }

  onMount(pickTarget)
</script>

<CustomRenderer
  effects={{
    godotFishEye: true,
    crt: {
      scan: 2,
      warp: 1,
    },
  }}
/>

<Rat
  scale={2}
  moving={box.movingSpeed}
  rotation.y={box.rotationY.current - Math.PI / 2}
  position.y={0.001}
  position.z={box.target.current.z}
  position.x={box.target.current.x}
></Rat>

<!-- <T.Mesh position={[box.target.target.x, 0, box.target.target.z]}>
  <T.BoxGeometry args={[0.2, 0.2, 0.2]} />
  <T.MeshBasicMaterial color={0xffff00} />
</T.Mesh> -->

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
    color={0xc0daa4}
    intensity={10}
    castShadow
    angle={Math.PI + Math.PI / 2}
    penumbra={4}
    decay={0.1}
    distance={20}
  /></T.PerspectiveCamera
>
<T.Mesh rotation.x={-Math.PI / 2} receiveShadow>
  <T.PlaneGeometry args={[22, 22, 10, 10]} />
  <T.MeshStandardMaterial color={0xeeeeee} side={2} />
</T.Mesh>

<T.AmbientLight intensity={0.4} />
