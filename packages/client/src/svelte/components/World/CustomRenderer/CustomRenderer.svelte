<script lang="ts">
  import { useTask, useThrelte } from "@threlte/core"
  import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js"
  import { RenderPass } from "three/addons/postprocessing/RenderPass.js"
  import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js"
  import { RGBShiftShader } from "three/addons/shaders/RGBShiftShader.js"
  import { CRTShader } from "@components/World/CustomRenderer/shaders/CRTShader"
  import { FishEyeShader } from "@components/World/CustomRenderer/shaders/FishEyeShader"
  import { GodotFishEyeShader } from "@components/World/CustomRenderer/shaders/GodotFishEyeShader"
  import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js"
  import { Vector2, MathUtils } from "three"
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

  type FishEyeConfig = {
    horizontalFOV: number
    strength: number
    cylindricalRatio: number
  }

  export let effects: {
    rgbShift?: boolean
    bloom?: BloomConfig
    crt?: CRTConfig
    fishEye?: FishEyeConfig
    godotFishEye?: boolean
  }

  const {
    scene,
    renderer,
    camera: cameraStore,
    size,
    autoRender,
    renderStage,
  } = useThrelte()

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

      crtPass.uniforms["scan"].value = effects.crt.scan
      crtPass.uniforms["warp"].value = effects.crt.warp

      composer.addPass(crtPass)
    }

    if (effects.fishEye) {
      const fishEyePass = new ShaderPass(FishEyeShader)

      // Setup distortion effect
      let height =
        Math.tan(MathUtils.degToRad(effects.fishEye.horizontalFOV) / 2) /
        camera.aspect // will only work for PerspectiveCamera

      camera.fov = (Math.atan(height) * 2 * 180) / 3.1415926535
      camera.updateProjectionMatrix()

      fishEyePass.uniforms["strength"].value = effects.fishEye.strength
      fishEyePass.uniforms["height"].value = effects.fishEye.height
      fishEyePass.uniforms["aspectRatio"].value = camera.aspect
      fishEyePass.uniforms["cylindricalRatio"].value =
        effects.fishEye.cylindricalRatio

      composer.addPass(fishEyePass)
    }

    if (effects.godotFishEye) {
      const godotFishEyePass = new ShaderPass(GodotFishEyeShader)

      composer.addPass(godotFishEyePass)
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
  $: setupEffectComposer($cameraStore)
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
