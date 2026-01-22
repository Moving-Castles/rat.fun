<script lang="ts">
  import { BigButton } from "$lib/components/Shared"

  function goToRatFun() {
    window.location.href =
      "https://matcha.xyz/tokens/base/0xf2dd384662411a21259ab17038574289091f2d41"
  }
</script>

<div class="ended">
  <div class="content">
    <div class="title">AUCTION ENDED</div>
    <div class="button-container">
      <BigButton text="BUY $RAT" onclick={goToRatFun} />
    </div>
  </div>
</div>

<style lang="scss">
  .ended {
    text-align: center;

    .title {
      font-size: var(--font-size-super-large);
      font-family: var(--special-font-stack);
      letter-spacing: 2px;
      margin-bottom: 2rem;
    }

    .button-container {
      width: 100%;
      height: 160px;
    }
  }
</style>
