<script lang="ts">
  import { BigButton } from "$lib/components/Shared"
  import Mascot from "$lib/components/Shared/Mascot/Mascot.svelte"
  import type { TerminalOutputUnit } from "@ratfun/shared-ui/Mascot"
  import { playSound, randomPitch } from "$lib/modules/sound"

  function onType() {
    playSound("ratfunUI", "chirp", false, false, randomPitch())
  }

  const mascotText: TerminalOutputUnit[] = [
    {
      type: "text",
      content: "STARTING SOON",
      typeSpeed: 200,
      typeMode: "word",
      color: "var(--foreground)",
      backgroundColor: "transparent",
      onType
    }
  ]

  function goToTelegram() {
    window.location.href = "https://t.me/ratfun"
  }
</script>

<div class="not-started">
  <div class="content">
    <div class="mascot-container">
      <Mascot headBobOn={true} text={mascotText} hugeText={true} centerText={true} />
    </div>
    <div class="button-container">
      <BigButton text="Go to telegram" onclick={goToTelegram} />
    </div>
  </div>
</div>

<style lang="scss">
  .not-started {
    text-align: center;

    .mascot-container {
      width: var(--spawn-mascot-size);
      height: var(--spawn-mascot-size);
      margin: 0 auto var(--spawn-mascot-margin-bottom);
      pointer-events: none;
    }

    .button-container {
      width: 100%;
      height: 160px;
    }
  }
</style>
