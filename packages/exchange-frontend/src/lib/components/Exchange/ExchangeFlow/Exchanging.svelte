<script lang="ts">
  import { SmallSpinner } from "$lib/components/Shared"
</script>

<div class="exchanging">
  <div class="status">
    <span>Exchanging tokens</span>
    <SmallSpinner soundOn />
  </div>
  <p class="hint">Please confirm the exchange in your wallet</p>
</div>

<style lang="scss">
  .exchanging {
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;

    .status {
      font-size: var(--font-size-normal);
      font-family: var(--typewriter-font-stack);
      color: black;
      background: orangered;
      padding: 10px 20px;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .hint {
      font-size: var(--font-size-small);
      font-family: var(--typewriter-font-stack);
      color: var(--white);
      opacity: 0.8;
    }
  }
</style>
