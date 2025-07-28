// Re-export all shaders from their respective folders
import { noise } from "./noise"
import { gradient } from "./gradient"
import { waves } from "./waves"
import { plasma } from "./plasma"
import { plasmaHue } from "./plasma-hue"
import { plasmaOptimized } from "./plasma-optimized"

const shaders = {
  noise,
  gradient,
  waves,
  plasma,
  plasmaOptimized,
  plasmaHue
}

export { shaders }
