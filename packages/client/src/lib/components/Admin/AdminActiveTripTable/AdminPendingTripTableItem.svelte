<script lang="ts">
  import type { PendingTrip } from "$lib/components/Admin/types"

  let {
    pendingTrip
  }: {
    pendingTrip: PendingTrip
  } = $props()
</script>

<tr class="active-trip-table-item loading-row">
  <td class="cell-index">-</td>
  <td class="cell-description">
    <p class="single-line">{pendingTrip?.prompt ?? ""}</p>
  </td>
  <td class="cell-balance">0</td>
  <td class="cell-profit">0</td>
  <td class="cell-graph">
    <div class="mini-graph loading-graph"></div>
  </td>
  <td class="cell-actions"> </td>
</tr>

<style lang="scss">
  .loading-row {
    opacity: 0.6;
    background: #111;
    pointer-events: none;

    .loading-graph {
      height: 24px;
      width: 100%;
      background: repeating-linear-gradient(90deg, #333 0px, #444 10px, #333 20px);
      animation: loading-shimmer 1s infinite linear;
    }
  }

  .active-trip-table-item {
    height: 24px;
    font-size: var(--font-size-small);

    td {
      vertical-align: middle;
      line-height: 24px;
    }

    .single-line {
      margin: 0;
      padding: 0;
      border: none;
      max-width: 100%;
      display: inline-block;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    * {
      border: none;
      outline: none;
      border-width: 0;
    }

    td {
      overflow: hidden;
      margin: 0;
      vertical-align: top;
    }

    .cell-index {
      text-align: center;
      width: 40px;
    }

    .cell-prompt {
      padding: 0 6px;
    }

    .cell-visits {
      text-align: right;
      width: 60px;
    }

    .cell-balance {
      width: 120px;
      text-align: right;
      width: 80px;
    }

    .cell-profit {
      width: 120px;
      text-align: right;
      width: 60px;

      :global(*) {
        text-align: right;
      }
    }

    .cell-spark {
      width: 80px;
    }

    .cell-action {
      width: 100px;
      height: 100%;
    }

    .up {
      color: var(--color-up);
    }

    .down {
      color: var(--color-down);
    }

    .grey {
      color: grey;
    }
  }

  @keyframes loading-shimmer {
    0% {
      background-position: 0 0;
    }
    100% {
      background-position: 20px 0;
    }
  }
</style>
