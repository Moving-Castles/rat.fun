<script lang="ts">
  import { onMount, onDestroy } from "svelte"
  import { Tween } from "svelte/motion"
  import { fade } from "svelte/transition"
  import { createWebGLRenderer } from "$lib/modules/webgl"
  import { shaders } from "$lib/modules/webgl/shaders"
  import { cubicInOut, bounceIn } from "svelte/easing"
  import { page } from "$app/state"

  type Mode = "admin" | "home" | "outcome"

  let canvas: HTMLCanvasElement
  let renderer: any
  let lastMode = $state<Mode>(getShaderMode(page.url)) // used for comparison in the setUniforms function

  const getSpiralValue = (mode: Mode) => +(mode === "outcome") // Base 0
  // Formula to get the desired target
  const getInversionValue = (mode: Mode) => +(mode === "admin" || mode === "outcome") // Base 0
  const getSaturationValue = (mode: Mode) => (mode === "outcome" ? 0 : 1) // Base 1
  // New features
  const getContrastValue = (mode: Mode) => (mode === "outcome" ? -1 : 0.5) // Base 1
  const getExposureValue = (mode: Mode) => (mode === "outcome" ? 1 : 0) // Base 0

  // Return current mode based off the url
  function getShaderMode(url: URL) {
    if (url.pathname.includes("/admin")) {
      return "admin"
    } else if (url.pathname.includes("enter")) {
      return "outcome"
    } else {
      return "home"
    }
  }

  // Initial uniform values
  // Set up with easing and timing.
  // If you need to change these for different transitions,
  // do so inside the uniform's individual getter functions
  let spiral = new Tween(getSpiralValue(getShaderMode(page.url)), {
    easing: cubicInOut,
    duration: 3000
  })
  let invert = new Tween(getInversionValue(getShaderMode(page.url)), {
    easing: cubicInOut,
    duration: 2000
  })
  let saturation = new Tween(getSaturationValue(getShaderMode(page.url)))
  let contrast = new Tween(getContrastValue(getShaderMode(page.url)))
  let exposure = new Tween(getExposureValue(getShaderMode(page.url)))

  // Set all uniforms (call once, when the mode switches)
  function setUniforms(newMode: Mode) {
    spiral.set(getSpiralValue(newMode))
    invert.set(getInversionValue(newMode))
    contrast.set(getContrastValue(newMode))
    saturation.set(getSaturationValue(newMode))
    exposure.set(getExposureValue(newMode))

    // Transition complete
    lastMode = newMode
  }

  // Debounced resize handler
  let resizeTimeout: ReturnType<typeof setTimeout>

  const handleResize = () => {
    clearTimeout(resizeTimeout)
    resizeTimeout = setTimeout(() => {
      if (renderer) {
        renderer.resize()
      }
    }, 100) // Debounce resize events
  }

  // Update uniforms to shaders
  $effect(() => {
    spiral.current // this is needed for reactivity. ugh
    invert.current // this is needed for reactivity. ugh
    saturation.current
    contrast.current
    exposure.current
    if (renderer) {
      renderer.setUniform("u_spiral", spiral.current, "float")
      renderer.setUniform("u_invert", invert.current, "float")
      renderer.setUniform("u_saturation", saturation.current, "float")
      renderer.setUniform("u_contrast", contrast.current, "float")
      renderer.setUniform("u_exposure", exposure.current, "float")
    }
  })

  // Call the uniform updates whenever the mode changes
  $effect(() => {
    setUniforms(getShaderMode(page.url))
  })

  onMount(() => {
    if (!canvas) return

    renderer = createWebGLRenderer(canvas, {
      shader: shaders.clouds,
      uniforms: {
        u_spiral: { type: "float", value: spiral.current },
        u_invert: { type: "float", value: invert.current },
        u_saturation: { type: "float", value: saturation.current },
        u_contrast: { type: "float", value: contrast.current },
        u_exposure: { type: "float", value: exposure.current }
      }
    })

    renderer.render()

    // Add debounced resize listener
    window.addEventListener("resize", handleResize)
  })

  onDestroy(() => {
    if (renderer) {
      renderer.destroy()
    }

    // Clean up event listeners and intervals
    window.removeEventListener("resize", handleResize)
    if (resizeTimeout) {
      clearTimeout(resizeTimeout)
    }
  })
</script>

<div class="shader-test" in:fade>
  <canvas bind:this={canvas}></canvas>
</div>

<style lang="scss">
  .shader-test {
    text-align: center;
    color: var(--white);
    width: 100%;
    height: 100%;
    overflow: hidden;
    position: relative;

    canvas {
      display: block;
      width: 100%;
      height: 100%;
    }
  }
</style>
