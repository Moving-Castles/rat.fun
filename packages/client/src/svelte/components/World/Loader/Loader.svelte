<script lang="ts">
  import type { Texture } from "three"
  import { createEventDispatcher } from "svelte"
  import { RepeatWrapping } from "three"
  // import { useLoader } from "@threlte/core"
  // import { TextureLoader } from "three"
  import { useTexture } from "@threlte/extras"
  import { textures } from "@modules/three/assets/stores"

  const d = createEventDispatcher()

  // Define async writables
  const ground = useTexture("/ground.jpg", {
    transform: (texture: Texture) => {
      texture.wrapS = texture.wrapT = RepeatWrapping
      texture.repeat.set(50, 50)
    },
  })
  const sky = useTexture("/sky2.png")
  const crosshair = useTexture("/crosshair086.png")
  const face = useTexture("/face.jpg")

  // Await them
  $: if ($ground && $sky && $crosshair && $face) {
    textures.set([$ground, $sky, $crosshair, $face]) // may remove
    d("ready")
  }
</script>
