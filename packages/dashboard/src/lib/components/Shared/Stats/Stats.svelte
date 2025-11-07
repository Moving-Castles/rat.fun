<script lang="ts">
  import SignedNumber from "$lib/components/Shared/SignedNumber/SignedNumber.svelte"
  import { activeRats, inactiveRats, activeTrips, inactiveTrips } from "$lib/modules/state/stores"
  import { staticContent } from "$lib/modules/content"

  let startDate = $state<Date | null>(null)
  let endDate = $state<Date | null>(null)
</script>

<div class="stats">
  <div class="balance-container">
    <div class="balance rats">
      <h2 class="title">Rats</h2>
      <h1>
        *{Object.values($activeRats).length} / {Object.values($inactiveRats).length}†
      </h1>
      <h1 class="top">
        <SignedNumber withTween value={$staticContent?.statistics?.ratTotalBalance || 0} />
      </h1>
    </div>
    <div class="balance throughput">
      <h2 class="title">Throughput</h2>
      <h1>
        <SignedNumber value={$staticContent?.statistics?.totalThroughput} noColor hideSign />
      </h1>
    </div>
    <div class="balance trips">
      <h2 class="title">Trips</h2>
      <h1>
        *{Object.values($activeTrips).length} / {Object.values($inactiveTrips).length}†
      </h1>
      <h1 class="top">
        <SignedNumber withTween value={$staticContent?.statistics?.tripTotalBalance || 0} />
      </h1>
    </div>
  </div>
</div>

<style lang="scss">
  .stats {
    display: flex;
    gap: 1rem;
    justify-content: start;
    margin-bottom: 1rem;
    // align-items: center;

    h1,
    h2,
    p {
      margin: 0;
    }

    .balance-container {
      background: #eee;
      border: 1px solid #ccc;
      display: flex;
      padding: 1rem;
      gap: 1rem;

      .balance {
        width: 300px;
        padding: 40px 8px;
        background: white;
        text-align: center;
        position: relative;
        display: flex;
        flex-flow: column nowrap;
        justify-content: center;

        h1 {
          line-height: 0.9;
        }

        h2 {
          color: #aaa;
        }

        &.throughput {
          h2.title {
            position: absolute;
            top: 8px;
            left: 50%;
            transform: translate(-50%, 0);
          }
        }

        &.rats {
          h2.title {
            position: absolute;
            top: 8px;
            left: 12px;
          }
        }

        &.trips {
          h2.title {
            position: absolute;
            top: 8px;
            right: 12px;
          }
        }
      }
    }
  }
</style>
