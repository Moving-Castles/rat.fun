<script lang="ts">
  import { fade } from "svelte/transition"
  import { playSound } from "$lib/modules/sound"
  import { rat, ratImageUrl } from "$lib/modules/state/stores"
  import { transitionTo, RAT_BOX_STATE } from "$lib/components/Rat/state.svelte"
  import HealthBar from "./HealthBar.svelte"
</script>

<div class="rat-info-box">
  {#if $rat}
    <!-- INFO -->
    <div class="info-container">
      <!-- INDEX -->
      <div class="info-item">
        <span class="index">RAT #{$rat.index}</span>
      </div>

      <!-- NAME -->
      <div class="info-item">
        <span class="name">{$rat.name}</span>
      </div>

      <!-- HEALTHBAR -->
      <div class="info-item">
        <HealthBar value={Number($rat.balance)} />
      </div>

      <!-- TRIP COUNT -->
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <div
        class="info-item trip-count"
        role="button"
        tabindex="0"
        onclick={() => transitionTo(RAT_BOX_STATE.PAST_TRIP_LIST)}
      >
        <span>
          Trip Count: {$rat.tripCount ?? 0}
        </span>
      </div>
    </div>

    <!-- IMAGE -->
    <div class="image-container">
      <!-- svelte-ignore a11y_no_noninteractive_element_to_interactive_role -->
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <img
        role="button"
        onclick={() => playSound("ratfunUI", "chirp")}
        src={$ratImageUrl}
        draggable={false}
        alt={$rat.name}
        in:fade|global={{ duration: 400, delay: 300 }}
      />
    </div>
  {/if}
</div>

<style lang="scss">
  .rat-info-box {
    width: 100%;
    height: 100%;
    border-right: none;
    overflow: hidden;
    display: flex;
    background-image: url("/images/texture-5.png");
    background-size: 100px;
    justify-content: space-between;

    .info-container {
      width: calc(100% - 260px);
      overflow: hidden;

      .info-item {
        width: 100%;
        height: 40px;
        border-bottom: var(--default-border-style);
        display: flex;
        align-items: center;
        justify-content: space-between;

        .index {
          padding-inline: 10px;
          color: var(--foreground);
          font-size: var(--font-size-small);
        }

        .name {
          padding-inline: 10px;
          color: var(--foreground);
          font-size: var(--font-size-normal);
          color: var(--foreground);
        }

        &.trip-count {
          padding-inline: 10px;
          color: var(--foreground);
          font-size: var(--font-size-normal);
          cursor: pointer;
        }
      }
    }
    .image-container {
      width: 260px;
      height: 100%;
      border-left: var(--default-border-style);

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        filter: grayscale(1);
        mix-blend-mode: screen;
        cursor: grab;
        transition: transform 0.2s ease;

        &:active {
          transform: scale(0.9);
          transition: transform 0.2s ease;
        }
      }
    }
  }
</style>
