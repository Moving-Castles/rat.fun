<script lang="ts">
  import { SmallButton } from "$lib/components/Shared"
  import type { TutorialStep } from "./types"

  let {
    step,
    onNext
  }: {
    step: TutorialStep
    onNext: () => void
  } = $props()
</script>

{#if step === 1}
  <div class="tutorial-box">
    <p>
      Every <span class="highlight">RAT</span> can store <span class="highlight">HEALTH</span> and
      <span class="highlight">PSYCHO OBJECTS</span>.
    </p>
    <p>Both have commercial value for the company in $RAT tokens.</p>
    <p class="warning">If your RAT dies, you lose all progress.</p>
    <div class="tutorial-btn-container">
      <SmallButton text="NEXT" onclick={onNext} />
    </div>
  </div>
{:else if step === 2}
  <div class="tutorial-box">
    <p>Send your RAT tripping here.</p>
    <p>
      <span class="highlight">TRIPS</span> are unregulated psychedelics that might materialize
      <span class="highlight">PSYCHO OBJECTS</span>.
    </p>
    <p>May be lethal to RATS in some (most) cases.</p>
    <p><span class="highlight">COMPANY TRIPS</span> are a great start for the inexperienced.</p>
    <div class="tutorial-btn-container">
      <SmallButton text="NEXT" onclick={onNext} />
    </div>
  </div>
{:else if step === 3}
  <div class="tutorial-box">
    <p>
      <span class="highlight">PSYCHO OBJECTS</span> can help your RAT survive more intense TRIPS.
    </p>
    <p>They have commercial value in $RAT tokens.</p>
    <div class="tutorial-btn-container">
      <SmallButton text="NEXT" onclick={onNext} />
    </div>
  </div>
{:else if step === 4}
  <div class="tutorial-box">
    <p>
      You can unlock access to the <span class="highlight">TRIPS LAB</span> and experiment by making
      bespoke <span class="highlight">TRIPS</span>.
    </p>
    <p>You invest $RAT tokens in TRIPS.</p>
    <p>Each time a RAT dies using one of your TRIPS you collect its $RAT value.</p>
    <p>If a RAT survives it transfers $RAT from your TRIP to itself.</p>
    <div class="tutorial-btn-container">
      <SmallButton text="NEXT" onclick={onNext} />
    </div>
  </div>
{:else if step === 5}
  <div class="tutorial-box">
    <p>
      You can <span class="highlight">CASH OUT</span> at any moment, converting your RAT and PSYCHO OBJECTS
      in $RAT tokens.
    </p>
    <p>Minus of course a small corporate tax.</p>
    <div class="tutorial-btn-container">
      <SmallButton text="I'M READY" onclick={onNext} />
    </div>
  </div>
{/if}

<style lang="scss">
  .tutorial-box {
    font-family: var(--special-font-stack);
    font-size: var(--font-size-large);
    padding: 15px;
    width: 100%;
    line-height: 1.2em;

    p {
      margin: 0 0 10px 0;

      &:last-of-type {
        margin-bottom: 0;
      }
    }

    .highlight {
      background: var(--foreground-light-transparent);
      padding: 2px 4px;
    }

    .warning {
      color: var(--color-bad);
    }
  }

  .tutorial-btn-container {
    margin-top: 10px;
    height: 60px;
  }
</style>
