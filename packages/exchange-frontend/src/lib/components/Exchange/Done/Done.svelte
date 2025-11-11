<script lang="ts">
  import { BigButton } from "$lib/components/Shared"
</script>

<div class="done">
  <div class="content">
    <div class="success-message">
      <h2>Exchange Complete</h2>
      <p>Your $FAKERAT tokens have been successfully exchanged for $RAT tokens.</p>
    </div>
    <div class="button-container">
      <BigButton
        text="Go to game"
        onclick={() => {
          window.location.href = "https://rat.fun"
        }}
      />
    </div>
  </div>
</div>

<style lang="scss">
  .done {
    text-align: center;
    color: var(--white);
    width: 100vw;
    height: 100vh;
    overflow: hidden;
    position: relative;
    background-size: 200px;
    display: flex;
    justify-content: center;
    align-items: center;

    .content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 30px;
      max-width: 600px;
      padding: 20px;
    }

    .success-message {
      font-family: var(--typewriter-font-stack);
      color: black;
      background: var(--white);
      padding: 30px;
      border-radius: 4px;

      h2 {
        font-size: var(--font-size-large);
        margin: 0 0 15px 0;
        color: orangered;
      }

      p {
        font-size: var(--font-size-normal);
        margin: 10px 0;
        line-height: 1.5;
      }
    }

    .button-container {
      width: 100%;
      max-width: 400px;
      height: 200px;
      display: flex;
      justify-content: center;
      align-items: center;
    }
  }
</style>
