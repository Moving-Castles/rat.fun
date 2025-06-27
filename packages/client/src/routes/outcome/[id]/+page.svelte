<script lang="ts">
  import { page } from "$app/state"
  import { staticContent } from "$lib/modules/content"
  import { VideoLoader } from "$lib/components/Shared"
  import { LogItem } from "$lib/components/Room"

  let staticOutcomeContent = $derived(
    $staticContent?.outcomes?.find(r => r._id == (page.params.id ?? ""))
  )
</script>

{#if staticOutcomeContent}
  {#each staticOutcomeContent?.log as logEntry, i}
    <LogItem delay={i * 2} {logEntry} />
  {/each}
{:else}
  <VideoLoader duration={500} />
{/if}
