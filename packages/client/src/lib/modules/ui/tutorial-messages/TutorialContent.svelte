<script lang="ts">
  import { SmallButton } from "$lib/components/Shared"
  import type { TutorialStep } from "./types"
  import { rat } from "$lib/modules/state/stores"

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
    <p>This is <span class="highlight">{$rat?.name ?? "your rat"}</span></p>
    <p>It has 100 health.</p>
    <p>Every trip risks rat death</p>
    <p>Rat die = lose everything</p>
    <div class="tutorial-btn-container">
      <SmallButton text="NEXT" onclick={onNext} />
    </div>
  </div>
{:else if step === 2}
  <div class="tutorial-box">
    <p>Rat enter trips. Trips can give max reward in health and objects.</p>
    <p><span class="highlight">Company trips</span> good start.</p>
    <div class="tutorial-btn-container">
      <SmallButton text="NEXT" onclick={onNext} />
    </div>
  </div>
{:else if step === 3}
  <div class="tutorial-box">
    <p>Rat collect objects from trips</p>
    <p>Objects worth money. Objects help rat in future trips</p>
    <div class="tutorial-btn-container">
      <SmallButton text="NEXT" onclick={onNext} />
    </div>
  </div>
{:else if step === 4}
  <div class="tutorial-box">
    <p>Once rat has high value from health and objects</p>
    <p class="action">Kill rat</p>
    <p>Company pay you value equivalent</p>
    <p class="warning">Everything is your fault, OPERATOR</p>
    <div class="tutorial-btn-container">
      <SmallButton text="BEGIN OPERATIONS" onclick={onNext} />
    </div>
  </div>
{/if}

<style lang="scss">
  .tutorial-box {
    font-family: var(--special-font-stack);
    font-size: 18px;
    padding: 15px;
    max-width: 320px;

    p {
      margin: 0 0 10px 0;

      &:last-of-type {
        margin-bottom: 0;
      }
    }

    .highlight {
      background: var(--color-value);
      padding: 2px 4px;
    }

    .warning {
      color: red;
    }

    .action {
      font-weight: bold;
    }
  }

  .tutorial-btn-container {
    margin-top: 10px;
    height: 40px;
  }
</style>
