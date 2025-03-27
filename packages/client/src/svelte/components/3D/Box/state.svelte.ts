import { Tween } from "svelte/motion"
const rotationY = $state(new Tween(0, { duration: 400 }))
const movingSpeed = $state(new Tween(1, { duration: 200 }))
const target = $state(new Tween({ x: 0, z: 0 }, { duration: 3000 }))
const moving = $state(new Tween(0))

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
    },
  }
}
