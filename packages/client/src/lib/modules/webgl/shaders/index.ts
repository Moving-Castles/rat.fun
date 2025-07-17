// Re-export all shaders from their respective folders
import { noise } from "./noise"
import { gradient } from "./gradient"
import { waves } from "./waves"
import { plasma } from "./plasma"

const shaders = {
  noise,
  gradient,
  waves,
  plasma
}

export { shaders }
