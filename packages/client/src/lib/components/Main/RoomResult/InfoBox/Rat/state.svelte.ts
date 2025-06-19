import { gsap } from "gsap"

const timeline = $state(
  gsap.timeline({
    defaults: {},
  })
)

export function getRatInfoboxState() {
  return {
    get timeline() {
      return timeline
    },
  }
}
