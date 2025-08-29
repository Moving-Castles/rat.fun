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
  kaleidoscopeTunnel
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

/**
 * Helper function to create mode configurations
 */
function defineShaderModes<TMode extends string>(
  modes: ShaderModeConfig<TMode>
): ShaderModeConfig<TMode> {
  return modes
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
  createShaderManager,
  defineShaderModes
}
