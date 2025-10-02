<script lang="ts">
  import { onMount } from "svelte"
  import { gsap } from "gsap"
  import { TextPlugin } from "gsap/TextPlugin"
  import type { Room as SanityRoom } from "@sanity-types"
  import { playUISound } from "$lib/modules/sound/state.svelte"

  import LogoBox from "./Boxes/LogoBox.svelte"
  import TextLogBox from "./Boxes/TextLogBox.svelte"
  import TripPromptBox from "./Boxes/TripPromptBox.svelte"
  import VideoFeedBox from "./Boxes/VideoFeedBox.svelte"
  import DataFeedBox from "./Boxes/DataFeedBox.svelte"
  import BrainScanBox from "./Boxes/BrainScanBox.svelte"

  gsap.registerPlugin(TextPlugin)

  const {
    onComplete,
    staticRoomContent
  }: {
    onComplete: () => void
    staticRoomContent: SanityRoom | undefined
  } = $props()

  const SETUP_DURATION = 5000

  onMount(async () => {
    playUISound("ratfun", "tripSetupv2")
    setTimeout(() => {
      onComplete()
    }, SETUP_DURATION)
  })
</script>

<div class="splash-screen">
  <div class="inner">
    <!-- GROUP 1 -->
    <div class="box-group-1">
      <div class="box-group-1-slot-1">
        <LogoBox />
      </div>
      <div class="box-group-1-slot-2">
        <TextLogBox />
      </div>
    </div>
    <!-- GROUP 2 -->
    <div class="box-group-2">
      <VideoFeedBox />
    </div>
    <!-- GROUP 3 -->
    <div class="box-group-3">
      <div class="box-group-3-slot-1">
        <TripPromptBox {staticRoomContent} />
      </div>
      <div class="box-group-3-slot-2">
        <BrainScanBox />
      </div>
      <div class="box-group-3-slot-3">
        <DataFeedBox />
      </div>
    </div>
  </div>
</div>

<style lang="scss">
  .splash-screen {
    padding: 0;
    position: fixed;
    top: 0;
    left: 0;
    height: 100vh;
    width: 100vw;
    color: var(--foreground);
    font-size: var(--font-size-normal);
    background: rgba(0, 0, 0, 0.1);

    .inner {
      display: flex;
      flex-wrap: wrap;
      font-size: var(--font-size-normal);
      width: calc(100% - 30px);
      height: calc(100% - 40px);
      border: 5px double #444444;

      .box-group-1 {
        display: flex;
        flex-direction: column;
        width: 50%;
        height: 50%;

        .box-group-1-slot-1 {
          width: 100%;
          height: 100px;
          border-bottom: 5px double #444444;
        }

        .box-group-1-slot-2 {
          width: 100%;
          height: calc(100% - 100px);
          border-bottom: 5px double #444444;
        }
      }

      .box-group-2 {
        display: flex;
        flex-direction: column;
        width: 50%;
        height: 50%;
        border-bottom: 5px double #444444;
        border-left: 5px double #444444;
      }

      .box-group-3 {
        display: flex;
        flex-direction: row;
        width: 100%;
        height: 50%;

        .box-group-3-slot-1 {
          width: 33.33%;
          height: 100%;
          border-right: 5px double #444444;
        }
        .box-group-3-slot-2 {
          width: 33.33%;
          height: 100%;
          border-right: 5px double #444444;
        }
        .box-group-3-slot-3 {
          width: 33.33%;
          height: 100%;
        }
      }
    }
  }
</style>
