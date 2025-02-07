<script lang="ts">
  import { T, useTask } from "@threlte/core"

  export let id: string

  const task = useTask(id, delta => {
    console.log()
  })
</script>
