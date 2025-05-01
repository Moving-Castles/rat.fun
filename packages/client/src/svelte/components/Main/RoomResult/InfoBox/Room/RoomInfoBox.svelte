<script lang="ts">
  import { frozenRoom } from "@components/Main/RoomResult/state.svelte"
  import { staticContent, lastUpdated, urlFor } from "@modules/content"
  import type { Hex } from "viem"

  let { roomId }: { roomId: Hex } = $props()

  let sanityRoomContent = $derived(
    $staticContent.rooms.find(r => r._id == roomId)
  )
</script>

<div class="room-info-box">
  {#if $frozenRoom}
    <!-- INFO -->
    <div class="column">
      <!-- ID -->
      <div class="info-item">
        <span class="id">ROOM #{$frozenRoom.index}</span>
      </div>
      <!-- IMAGE -->
      <div class="image-container">
        {#key $lastUpdated}
          {#if sanityRoomContent}
            <img
              src={urlFor(sanityRoomContent?.image)
                .width(300)
                .auto("format")
                .saturation(-100)
                .url()}
              alt={$frozenRoom.name}
            />
          {:else}
            <img src="/images/room3.jpg" alt={$frozenRoom.name} />
          {/if}
        {/key}
      </div>
      <!-- BALANCE -->
      <div class="info-item">
        <span class="balance" class:empty={$frozenRoom.balance === 0}>
          ${$frozenRoom.balance}
        </span>
      </div>
    </div>
    <!-- PROMPT -->
    <div class="column double">
      <div class="room-description">{$frozenRoom.roomPrompt}</div>
    </div>
  {/if}
</div>

<style lang="scss">
  .room-info-box {
    width: calc(50% - 50px);
    height: 100%;
    border: var(--default-border-style);
    border-left: none;
    overflow: hidden;
    display: flex;
  }

  .image-container {
    width: 100px;
    height: 100px;
    border: var(--default-border-style);
    margin: 10px;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      opacity: 0.8;
    }

    .death {
      position: absolute;
      inset: 0;
      z-index: 9;
    }
  }

  .column {
    width: calc(100% / 3);
    border-right: var(--dashed-border-style);
    overflow-x: hidden;
    overflow-y: scroll;

    &.double {
      width: calc(200% / 3);
    }

    .header {
      width: 100%;
      padding-bottom: 10px;
      margin-bottom: 10px;
      border-bottom: var(--dashed-border-style);
    }

    &.info {
      display: grid;
      grid-template-rows: 1fr 20px;
      gap: 12px;
    }

    &:last-child {
      border-right: var(--default-border-style);
    }
  }

  .info-item {
    display: flex;
    margin: 10px;
    gap: 10px;

    .id {
      background: var(--color-grey-light);
      padding: 5px;
      color: black;
      font-size: var(--font-size-small);
    }

    .name {
      background: var(--color-alert);
      padding: 5px;
      color: black;
    }

    .balance {
      background: var(--color-value);
      padding: 5px;
      color: black;

      &.empty {
        background: var(--color-death);
      }
    }

    .health {
      background: var(--color-health);
      padding: 5px;
      color: black;
    }
  }

  .header {
    border-bottom: var(--dashed-border-style);
    padding: 5px;
  }

  .room-description {
    margin: 10px;
    padding: 5px;
    background: var(--color-alert);
    color: black;
    max-width: 50ch;
  }
</style>
