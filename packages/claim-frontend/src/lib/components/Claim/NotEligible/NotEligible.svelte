<script lang="ts">
  // Shown when user is not in the merkle tree
</script>

<div class="not-eligible">
  <div class="content">
    <h2>Not Eligible</h2>
    <p>This wallet address is not eligible for the airdrop.</p>
  </div>
</div>

<style lang="scss">
  .not-eligible {
    text-align: center;
    color: var(--white);
    display: flex;
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
  }
</style>
