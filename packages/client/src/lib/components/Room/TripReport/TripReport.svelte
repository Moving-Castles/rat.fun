<script lang="ts">
  import { Log } from "$lib/components/Room"

  let { onComplete, result } = $props()
</script>

<!-- LOG -->
<Log {result} {onComplete} />

<style lang="scss">
</style>
