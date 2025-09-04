<script lang="ts">
  import { fade } from "svelte/transition"
  import { RatInfoBox, RoomInfoBox, Log } from "$lib/components/Room"

  let { onComplete, result, staticRoomContent } = $props()
</script>

<!-- <div transition:fade|global class="info-boxes"> -->
<!-- <RatInfoBox /> -->
<!-- <div class="divider"></div> -->
<!-- <RoomInfoBox {staticRoomContent} /> -->
<!-- </div> -->

<!-- LOG -->
<Log {result} {onComplete} />

<style lang="scss">
  .info-boxes {
    display: flex;
    justify-content: space-between;
    width: 100%;
    height: var(--info-box-height);
  }

  .divider {
    width: 100px;
    height: 100%;
    background: repeating-linear-gradient(
      45deg,
      #000000,
      #000000 20px,
      var(--color-grey-dark) 20px,
      var(--color-grey-dark) 40px
    );
    border: var(--default-border-style);
  }
</style>
