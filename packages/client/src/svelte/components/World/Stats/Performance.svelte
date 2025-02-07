<script lang="ts">
  import { ThreePerf } from "three-perf"
  import { useTask, useThrelte, useStage } from "@threlte/core"

  export let renderer
  export const perf = new ThreePerf({
    anchorX: "left",
    anchorY: "top",
    domElement: document.body, // or other canvas rendering wrapper
    renderer: renderer, // three js renderer instance you use for rendering
  })

  const { renderStage } = useThrelte()

  const beforeRenderStage = useStage("before-render", {
    before: renderStage,
  })
  const afterRenderStage = useStage("after-render", {
    after: renderStage,
  })

  useTask(
    "begin",
    () => {
      perf.overclockingFps = false
      perf.begin()
    },
    { stage: beforeRenderStage }
  )

  useTask(
    "end",
    () => {
      perf.end()
    },
    { stage: afterRenderStage }
  )
</script>
