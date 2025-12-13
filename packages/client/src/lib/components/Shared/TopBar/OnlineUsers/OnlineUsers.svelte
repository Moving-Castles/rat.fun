<script lang="ts">
  import { goto } from "$app/navigation"
  import { page } from "$app/stores"
  import { OperatorFeedButton } from "$lib/components/Shared"

  const isOnOperatorFeed = $derived($page.url.pathname === "/operator-feed")

  function handleClick() {
    if (isOnOperatorFeed) {
      goto("/")
    } else {
      goto("/operator-feed")
    }
  }
</script>

<div class="operator-feed-button">
  <OperatorFeedButton
    isActive={isOnOperatorFeed}
    tippyText={isOnOperatorFeed ? "Back to game" : "Operator Feed"}
    onclick={handleClick}
  />
</div>

<style lang="scss">
  .operator-feed-button {
    width: 160px;
    height: 100%;

    @media (max-width: 800px) {
      display: none;
    }
  }
</style>
