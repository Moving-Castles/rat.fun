<script lang="ts">
  import { gameConfig } from "@modules/state/base/stores"
</script>

<div class="world-prompt-box">
  <div class="header">
    <div class="header-text">World Prompt</div>
    <div class="header-countdown">10:00</div>
  </div>
  <div class="prompt">
    <div class="prompt-text">{$gameConfig?.worldPrompt}</div>
  </div>
</div>

<style lang="scss">
  .world-prompt-box {
    display: flex;
    flex-direction: row;
    border-bottom: var(--default-border-style);
    height: var(--world-prompt-box-height);
    display: flex;
    flex-direction: column;
    text-align: center;
    background-color: var(--color-grey-darker);

    .header {
      border-bottom: var(--default-border-style);
      padding-top: 5px;
      padding-bottom: 5px;
      padding-inline: 10px;
      font-size: var(--font-size-small);
      display: flex;
      flex-direction: row;
      justify-content: space-between;
    }

    .prompt {
      padding-inline: 5px;
      padding-top: 5px;
      padding-bottom: 5px;
      height: 100%;
      font-family: var(--special-font-stack);
      font-size: var(--font-size-large);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
  }
</style>
