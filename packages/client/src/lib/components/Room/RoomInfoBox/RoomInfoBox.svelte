<script lang="ts">
  import { frozenRoom } from "$lib/components/Room/RoomResult/state.svelte"
  import { lastUpdated } from "$lib/modules/content"
  import { urlFor } from "$lib/modules/content/sanity"
  import { renderSafeString } from "$lib/modules/utils"
  import { NumberGoing, NoImage } from "$lib/components/Shared"

  let { staticRoomContent }: { staticRoomContent: any } = $props()

  let depleted = false
</script>

<div class="room-info-box" class:depleted>
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
          {#if staticRoomContent?.image?.asset}
            <img
              src={urlFor(staticRoomContent?.image)?.width(300)?.auto("format")?.url()}
              alt={`room #${$frozenRoom.index}`}
            />
          {:else}
            <NoImage />
          {/if}
        {/key}
      </div>
      <!-- BALANCE -->
      <div class="info-item">
        <span class="balance" class:empty={Number($frozenRoom.balance) === 0}>
          $<NumberGoing value={$frozenRoom.balance} />
        </span>
      </div>
    </div>
    <!-- PROMPT -->
    <div class="column double">
      <div class="room-description">
        {renderSafeString($frozenRoom.prompt)}
      </div>
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
    position: relative;
    background-color: var(--background-semi-transparent);
    background-image: url("/images/texture-3.png");
    background-size: 200px;

    &.depleted {
      &::after {
        content: "DEPLETED";
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 100px;
        background: var(--color-value);
        color: var(--black);
        font-family: var(--label-font-stack);
      }
    }
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
  }

  .column {
    width: calc(100% / 3);
    border-right: var(--dashed-border-style);
    overflow-x: hidden;
    overflow-y: scroll;

    &.double {
      width: calc(200% / 3);
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
      color: var(--background);
      font-size: var(--font-size-small);
    }

    .balance {
      background: var(--color-value);
      padding: 5px;
      color: var(--background);

      &.empty {
        background: var(--color-death);
      }
    }
  }

  .room-description {
    margin: 10px;
    padding: 5px;
    background: var(--color-alert);
    color: var(--background);
    max-width: 50ch;
  }
</style>
