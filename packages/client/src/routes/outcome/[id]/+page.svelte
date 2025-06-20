<script lang="ts">
  import { onMount } from "svelte"
  import { page } from "$app/state"
  import { staticContent } from "$lib/modules/content"
	import VideoLoader from "$lib/components/Main/Shared/VideoLoader/VideoLoader.svelte"
  import LogItem from "$lib/components/Main/RoomResult/Log/LogItem.svelte"

  let staticOutcomeContent = $derived(
    $staticContent?.outcomes?.find(r => r._id == (page.params.id ?? ""))
  )

  $inspect(staticOutcomeContent)
</script>

{#if staticOutcomeContent}
  {#each staticOutcomeContent?.log as logEntry, i}
    <LogItem delay={i * 2} {logEntry} />
  {/each}
{:else}
  <VideoLoader duration={500} />
{/if}