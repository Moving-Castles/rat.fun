<script lang="ts">
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
    <p>This is <span class="highlight">{$rat?.name ?? "your rat"}</span>, it has 100 health.</p>
    <p>Every trip risk rat death</p>
    <p class="warning">Rat die = lose everything</p>
    <button class="tutorial-btn" onclick={onNext}>NEXT</button>
  </div>
{:else if step === 2}
  <div class="tutorial-box">
    <p>Rat enter trips. Trips can give max reward in health and objects.</p>
    <p><span class="highlight">Company trips</span> good start.</p>
    <button class="tutorial-btn" onclick={onNext}>NEXT</button>
  </div>
{:else if step === 3}
  <div class="tutorial-box">
    <p>Rat collect objects from trips</p>
    <p>Objects worth money. Objects help rat in future trips</p>
    <button class="tutorial-btn" onclick={onNext}>NEXT</button>
  </div>
{:else if step === 4}
  <div class="tutorial-box">
    <p>Once rat has high value from health and objects</p>
    <p class="action">Kill rat</p>
    <p>Company pay you value equivalent</p>
    <p class="warning">Everything your fault, OPERATOR</p>
    <button class="tutorial-btn" onclick={onNext}>BEGIN OPERATIONS</button>
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

  .tutorial-btn {
    margin-top: 15px;
    padding: 10px 20px;
    background: black;
    color: white;
    border: none;
    font-family: var(--special-font-stack);
    font-size: 16px;
    cursor: pointer;
    width: 100%;

    &:hover {
      background: #333;
    }
  }
</style>
