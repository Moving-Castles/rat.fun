import { Tween } from "svelte/motion"
const rotationY = $state(new Tween(0, { duration: 400 }))
const movingSpeed = $state(new Tween(1, { duration: 200 }))
const target = $state(new Tween({ x: 0, z: 0 }, { duration: 3000 }))
const moving = $state(new Tween(0))
let speedBeforePause = $state(1)
let targetBeforePause = $state(target.current)
let timeout: ReturnType<typeof setTimeout>

const pickTarget = async () => {
  clearTimeout(timeout)
  const [x, z] = [
    Math.floor(Math.random() * 10) - 5,
    Math.floor(Math.random() * 10) - 5,
  ]
  const [dx, dz] = [x - target.current.x, z - target.current.z]

  const distance = Math.sqrt(dx * dx + dz * dz)
  const targetAngle = Math.atan2(dx, dz)

  // Compute the shortest rotation direction
  let angleDiff = targetAngle - rotationY.current
  angleDiff = ((angleDiff + Math.PI) % (2 * Math.PI)) - Math.PI

  const newRotationY = rotationY.current + angleDiff

  rotationY.set(newRotationY, { duration: Math.abs(angleDiff) * 200 })

  movingSpeed.set(1)

  await target.set({ x, z }, { duration: distance * 500 })

  movingSpeed.set(0.2)

  timeout = setTimeout(pickTarget, 300 + Math.random() * 1000)
}

export const getBoxState = () => {
  return {
    box: {
      get rotationY() {
        return rotationY
      },
      get movingSpeed() {
        return movingSpeed
      },
      get target() {
        return target
      },
      get moving() {
        return moving
      },
      pause: () => {
        if (target.current === target.target) return
        console.log("pause")
        speedBeforePause = movingSpeed.current
        targetBeforePause = target.current
        moving.set(0)
        target.set(target.current)
        movingSpeed.set(0.03)
        console.log(target.current.x, target.current.z)
      },
      resume: () => {
        console.log("resume")
        moving.set(1)
        movingSpeed.set(1)
        pickTarget()
      },
      pickTarget,
    },
  }
}
