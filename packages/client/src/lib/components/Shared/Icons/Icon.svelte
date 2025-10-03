<script lang="ts">
  import Asterisk from "./Asterisk.svelte"

  let { name, width = 24 }: { name: "Asterisk"; width?: number } = $props()

  let components = {
    Asterisk
  }

  let Component = $derived(components[name])
</script>

<Component {width} />
