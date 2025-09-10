import { ShaderConfiguration, ShaderManager, ShaderModeConfig } from "./ShaderManager.svelte"

// Re-export all shaders from their respective folders
import { main, type ShaderMode as MainMode } from "./main"
import { copy, type ShaderMode as CopyMode } from "./copy"
import { noise, type ShaderMode as NoiseMode } from "./noise"
import { gradient, type ShaderMode as GradientMode } from "./gradient"
import { waves, type ShaderMode as WavesMode } from "./waves"
import { plasma, type ShaderMode as PlasmaMode } from "./plasma"
import { plasmaHue, type ShaderMode as PlasmaHueMode } from "./plasma-hue"
import { plasmaOptimized, type ShaderMode as PlasmaOptimizedMode } from "./plasma-optimized"
import { clouds, type ShaderMode as CloudsMode } from "./clouds"
import { zoomTunnel, type ShaderMode as ZoomTunnelMode } from "./zoom-tunnel"
import { spiralVortex, type ShaderMode as SpiralVortexMode } from "./spiral-vortex"
import { starspeed, type ShaderMode as StarSpeedMode } from "./starspeed"
import {
  colorCyclingPlasma,
  type ShaderMode as ColorCyclingPlasmaMode
} from "./color-cycling-plasma"
import { checkerZoomer, type ShaderMode as CheckerZoomerMode } from "./checker-zoomer"
import {
  lissajousWarpField,
  type ShaderMode as LissajousWarpFieldMode
} from "./lissajous-warp-field"
import {
  kaleidoscopeTunnel,
  type ShaderMode as KaleidoscopeTunnelMode
} from "./kaleidoscope-tunnel"
import { starfield, type ShaderMode as StarfieldMode } from "./starfield"
import { ratfun, type ShaderMode as RatfunMode } from "./ratfun"

const shaders = {
  //
  // Main game shader
  main,
  //
  // This could be yours
  copy,
  //
  // Other ones
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
  kaleidoscopeTunnel,
  starfield,
  starspeed,
  ratfun
}

/**
 * Generic shader state manager that can work with any shader configuration
 */

/**
 * Factory function for creating shader managers with configuration
 */
function createShaderManager<TMode extends string = string>(config: ShaderConfiguration<TMode>) {
  return new ShaderManager(config)
}

type ShaderModes = {
  Main: MainMode
  Copy: CopyMode
  Noise: NoiseMode
  Gradient: GradientMode
  Waves: WavesMode
  Plasma: PlasmaMode
  PlasmaHue: PlasmaHueMode
  PlasmaOptimized: PlasmaOptimizedMode
  Clouds: CloudsMode
  ZoomTunnel: ZoomTunnelMode
  SpiralVortex: SpiralVortexMode
  ColorCyclingPlasma: ColorCyclingPlasmaMode
  CheckerZoomer: CheckerZoomerMode
  LissajousWarpField: LissajousWarpFieldMode
  KaleidoscopeTunnel: KaleidoscopeTunnelMode
  Starfield: StarfieldMode
  StarSpeed: StarSpeedMode
  RatFun: RatfunMode
}

export {
  // Types
  type ShaderConfiguration,
  type ShaderModes,
  // Consts
  shaders,
  // Classes
  ShaderManager,
  // Functions
  createShaderManager
}
