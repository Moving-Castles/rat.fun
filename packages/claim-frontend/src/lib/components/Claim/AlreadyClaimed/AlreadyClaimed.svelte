<script lang="ts">
  import { BigButton } from "$lib/components/Shared"

  function goToRatFun() {
    window.location.href = "https://rat.fun"
  }
</script>

<div class="already-claimed">
  <div class="content">
    <h2>Already Claimed</h2>
    <p>This wallet has already claimed its $RAT allocation.</p>
  </div>
  <div class="button-container">
    <BigButton text="Go to rat.fun" onclick={goToRatFun} />
  </div>
</div>

<style lang="scss">
  .already-claimed {
    text-align: center;
    color: var(--white);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 2rem;

    .content {
      max-width: 400px;

      h2 {
        margin-bottom: 1rem;
      }

      p {
        opacity: 0.8;
      }
    }
    .button-container {
      width: 100%;
      height: 160px;
    }
  }
</style>
