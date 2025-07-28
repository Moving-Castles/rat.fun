<script lang="ts">
  import { getRoomOwnerName } from "$lib/modules/state/utils"
  import { lastUpdated } from "$lib/modules/content"
  import { urlFor } from "$lib/modules/content/sanity"
  import { getModalState } from "$lib/components/Shared/Modal/state.svelte"
  import { NoImage, ModalTarget } from "$lib/components/Shared"

  let { room, sanityRoomContent }: { room: Room; sanityRoomContent: any } = $props()

  let { modal } = getModalState()
  let showImageModal = $state(false)
</script>

<div class="room-preview-header">
  <!-- IMAGE -->
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="image" onclick={() => (showImageModal = true)}>
    {#key $lastUpdated}
      {#if sanityRoomContent}
        <img
          src={urlFor(sanityRoomContent?.image).width(600).auto("format").url()}
          alt={`room #${room.index}`}
        />
      {:else}
        <div class="image-placeholder">
          <NoImage />
        </div>
      {/if}
    {/key}
  </div>
  <!-- INFO -->
  <div class="info">
    <!-- INDEX -->
    <div class="row index">
      <div class="label">ROOM</div>
      <div class="value">#{room.index}</div>
    </div>
    <!-- OWNER -->
    <div class="row">
      <div class="label">OWNER</div>
      <div class="value">{getRoomOwnerName(room)}</div>
    </div>
    <!-- VISIT COUNT -->
    <div class="row visit-count">
      <div class="label">VISITS</div>
      <div class="value">{room.visitCount}</div>
    </div>
    <!-- KILL COUNT -->
    {#if room?.killCount > 0}
      <div class="row kill-count">
        <div class="label">KILLS</div>
        <div class="value">{room?.killCount}</div>
      </div>
    {/if}
    <!-- BALANCE -->
    <div class="row balance" class:depleted={Number(room.balance) == 0}>
      <div class="label">BALANCE</div>
      <div class="value">${room.balance}</div>
    </div>
  </div>
</div>

{#snippet roomImageModal()}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="image-modal" onclick={() => modal.close()}>
    <img
      src={urlFor(sanityRoomContent?.image).width(1200).auto("format").url()}
      alt={`room #${room.index}`}
    />
  </div>
{/snippet}

{#if showImageModal && sanityRoomContent}
  <ModalTarget
    fullscreen={true}
    onclose={() => (showImageModal = false)}
    content={roomImageModal}
  />
{/if}

<style lang="scss">
  .room-preview-header {
    border-bottom: var(--default-border-style);
    display: flex;
    flex-direction: row;
    background: var(--background);

    .image {
      border: 15px solid transparent;
      border-image: url("/images/border-2.png") 20 repeat;
      aspect-ratio: 1/1;
      width: 50%;
      line-height: 0;
      cursor: pointer;

      img {
        width: 100%;
        aspect-ratio: 1/1;
        object-fit: cover;
        border: var(--default-border-style);
      }

      .image-placeholder {
        width: 100%;
        aspect-ratio: 1/1;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 15px;
      }
    }

    .info {
      display: flex;
      flex-direction: column;
      width: 50%;

      .row {
        width: 100%;
        border-bottom: var(--default-border-style);
        height: 40px;
        padding-left: 5px;
        padding-right: 10px;
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
        font-size: var(--font-size-small);

        .value {
          font-family: var(--special-font-stack);
          font-size: var(--font-size-large);
        }

        &.balance {
          background: var(--color-value);
          color: var(--background);
          padding: 5px;
          height: auto;
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;

          &.depleted {
            background: var(--color-death);
            color: var(--background);
          }

          .value {
            font-size: var(--font-size-extra-large);
          }
        }

        &.index {
          color: var(--color-grey-mid);
        }
      }
    }
  }

  .image-modal {
    width: var(--game-window-width);
    height: var(--game-window-height);
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;

    img {
      max-width: 90%;
      max-height: 90%;
      object-fit: contain;
      border: var(--default-border-style);
      transition: opacity 0.2s ease;
    }
  }
</style>
