<script lang="ts">
  import SEO from "$lib/components/Shared/SEO/SEO.svelte"
  // import { AdminTripMonitor, AdminTripTable, CreateRoom } from "$lib/components/Admin"
  // import { BigButton, ModalTarget } from "$lib/components/Shared"

  let showCreateTrip = $state(false)
</script>

<SEO prependTitle="ADMIN" />

<div class="">
  <!-- <AdminTripMonitor /> -->
  <!-- <BigButton text="Create trip" onclick={() => (showCreateTrip = true)} /> -->
  <!-- In top bar: ProfitLossOverview -->

  <!-- Active Trip Monitor -->
  <!-- New Trip Dialog -->
  <!-- <AdminTripTable /> -->
  <!-- Active Trip Table -->
  <!-- Event feed -->

  <!-- Past Trip Monitor -->
  <!-- Past Trip Table -->
</div>

<!-- {#snippet createTrip()}
  <CreateRoom />
{/snippet} -->

<!-- {#if showCreateTrip}
  <ModalTarget
    onclose={() => {
      showCreateTrip = false
    }}
    content={createTrip}
  />
{/if} -->
