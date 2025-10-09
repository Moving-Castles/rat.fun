<script lang="ts">
  import { derived } from "svelte/store"
  import { playerLiquidatedRooms } from "$lib/modules/state/stores"

  let { focus } = $props()

  const investment = derived(playerLiquidatedRooms, $playerLiquidatedRooms =>
    Object.values($playerLiquidatedRooms).reduce((a, b) => a + Number(b.roomCreationCost), 0)
  )
  const liquidationValue = derived(playerLiquidatedRooms, $playerLiquidatedRooms =>
    Object.values($playerLiquidatedRooms).reduce((a, b) => a + Number(b.liquidationValue || 0), 0)
  )
  const profitLoss = derived([liquidationValue, investment], ([$lv, $i]) => $lv - $i)
  const portfolioClass = derived([profitLoss], ([$profitLoss]) => {
    if ($profitLoss === 0) return "neutral"
    return $profitLoss > 0 ? "upText" : "downText"
  })
</script>

<div class="admin-trip-monitor">
  <div class="p-l-overview">
    <div class="top">
      <p>Realized P&L</p>
      {#if $liquidationValue && $investment}
        <h1>
          <span class="main {$portfolioClass}"
            >{$profitLoss}
            <span class="small">({(($liquidationValue / $investment) * 100).toFixed(2)}%)</span
            ></span
          >
          <!-- {$liquidationValue / $investment} -->
        </h1>
      {:else}
        <h1>None</h1>
      {/if}
    </div>
  </div>
</div>

<style lang="scss">
  .admin-trip-monitor {
    width: 100%;
    display: flex;
    justify-content: flex-start;
    align-items: center;
    padding-top: 2rem;
    padding-bottom: 2rem;
    padding-left: 2rem;

    .downText {
      color: red;
    }

    .upText {
      color: #78ee72;
    }

    p {
      color: var(--color-grey-light);
      margin: 2rem 1rem;
    }

    h1 {
      font-family: var(--special-font-stack);
      font-size: 3.6rem;
      margin: 2rem 1rem;

      .main {
        background: rgba(0, 0, 0, 0.5);
        display: inline-block;
        border-radius: 4px;
        padding: 2rem 1.8rem 1rem;
      }

      .small {
        font-size: 2.6rem;
        display: inline-block;
        transform: translateY(-50%);
      }
    }
    h2 {
      font-family: var(--special-font-stack);
      font-size: 2rem;
      margin: 1.2rem 1rem;
    }

    .p-l-overview {
      // background: #000;
      min-width: 500px;
      width: 500px;
      padding-right: 1rem;
      display: grid;
      grid-template-columns: repeat(1fr, 2);
      grid-template-rows: repeat(1fr, 2);
      gap: 1rem;

      .top {
        grid-column: 1/3;
        background: rgba(0, 0, 0, 0.2);
        padding: 0.2rem;
      }
      .bottom-left,
      .bottom-right {
        padding: 0.2rem;
        margin: 0;
        background: rgba(0, 0, 0, 0.2);

        p {
          margin: 1.2rem 1rem;
        }
      }
    }

    .p-l-graph {
      height: 400px;
      width: 100%;
      background: #222;
      text-align: center;
      // font-size: 7rem;
      display: flex;
      justify-content: center;
      align-items: center;
    }
  }
</style>
