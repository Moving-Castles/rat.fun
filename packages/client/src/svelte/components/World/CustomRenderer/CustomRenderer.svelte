<script lang="ts">
  import { useTask, useThrelte } from "@threlte/core"
  import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js"
  import { RenderPass } from "three/addons/postprocessing/RenderPass.js"
  import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js"
  import { RGBShiftShader } from "three/addons/shaders/RGBShiftShader.js"
  import { CRTShader } from "@components/World/CustomRenderer/shaders/CRTShader"
  import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js"
  import { Vector2 } from "three"
  import { onMount } from "svelte"

  type BloomConfig = {
    radius?: number
    threshold?: number
    strength?: number
    resolution?: Vector2
  }

  type CRTConfig = {
    warp: number
    scan: number
  }

  export let effects: {
    rgbShift?: boolean
    bloom?: BloomConfig
    crt?: CRTConfig
  }

  const { scene, renderer, camera, size, autoRender, renderStage } =
    useThrelte()

  const composer = new EffectComposer(renderer)

  const setupEffectComposer = (camera: THREE.Camera) => {
    composer.addPass(new RenderPass(scene, camera))

    if (effects.rgbShift) {
      const rgbShiftPass = new ShaderPass(RGBShiftShader)
      rgbShiftPass.uniforms["amount"].value = 0.0026
      composer.addPass(rgbShiftPass)
    }

    if (effects.bloom) {
      const bloomPass = new UnrealBloomPass(
        effects.bloom?.resolution ||
          new Vector2(window.innerWidth, window.innerHeight),
        1.5,
        0.4,
        0.85
      )

      if (effects.bloom?.threshold) {
        bloomPass.threshold = effects.bloom.threshold
      }

      if (effects.bloom?.strength) {
        bloomPass.strength = effects.bloom.strength
      }

      if (effects.bloom.radius) {
        bloomPass.radius = effects.bloom.radius
      }

      if (effects.bloom.resolution) {
        bloomPass.resolution = effects.bloom.resolution
      }

      composer.addPass(bloomPass)
    }

    if (effects.crt) {
      const crtPass = new ShaderPass(CRTShader)

      // console.log("crt", effects.crt)

      crtPass.uniforms["scan"].value = effects.crt.scan
      crtPass.uniforms["warp"].value = effects.crt.warp

      composer.addPass(crtPass)

      // console.log("added crt")
    }
  }

  const updateEffects = e => {
    const keys = Object.keys(e)
    // console.log(keys)

    if (keys.includes("crt")) {
      const p = composer.passes?.find(p => p?.material?.name === "CRTShader")
      if (p) {
        p.uniforms["scan"].value = e.crt.scan
        p.uniforms["warp"].value = e.crt.warp
      }
    }
  }

  // If depends on other things than camera, add extra dependencies in function
  // signature and call them here
  $: setupEffectComposer($camera)
  $: composer.setSize($size.width, $size.height)
  $: {
    // console.log("effects updated", effects)
    updateEffects(effects)
  }

  onMount(() => {
    let before = autoRender.current
    autoRender.set(false)
    return () => {
      autoRender.set(before)
    }
  })

  useTask(
    "render-pass",
    delta => {
      composer.render(delta)
    },
    { stage: renderStage, autoInvalidate: false }
  )
</script>
