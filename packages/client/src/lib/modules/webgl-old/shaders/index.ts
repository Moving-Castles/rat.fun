// Re-export all shaders from their respective folders
import { noise } from "./noise"
import { gradient } from "./gradient"
import { waves } from "./waves"
import { plasma } from "./plasma"
import { plasmaHue } from "./plasma-hue"
import { plasmaOptimized } from "./plasma-optimized"
import { clouds } from "./clouds"
import { zoomTunnel } from "./zoom-tunnel"
import { spiralVortex } from "./spiral-vortex"
import { colorCyclingPlasma } from "./color-cycling-plasma"
import { checkerZoomer } from "./checker-zoomer"
import { lissajousWarpField } from "./lissajous-warp-field"
import { kaleidoscopeTunnel } from "./kaleidoscope-tunnel"

const shaders = {
  noise,
  gradient,
  waves,
  plasma,
  plasmaOptimized,
  plasmaHue,
  clouds,
  zoomTunnel,
  spiralVortex,
  colorCyclingPlasma,
  checkerZoomer,
  lissajousWarpField,
  kaleidoscopeTunnel
}

export { shaders }
