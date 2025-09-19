<script lang="ts">
  import { SmallButton, CreateRoom } from "$lib/components/Shared"

  let sidebar = $state(false)
</script>

<div class="admin-trip-table-container">
  <table class="admin-trip-table">
    <thead>
      <tr>
        <td><!-- Trip --></td>
        <td>$SLOP</td>
        <td>P&L</td>
        <td>Age</td>
        <td>Spark</td>
        <td><!-- Action --></td>
      </tr>
    </thead>
    <tbody>
      <tr
        onclick={() => {
          sidebar = true
        }}
        class="simple-row"
      >
        <td class="cell-description"
          >This trip is volatile and churny; all interactions are fast and can swing balance
          quickly. Keep hands on controls.</td
        >
        <td class="cell-balance">200</td>
        <td class="cell-profit-loss">+1000</td>
        <td class="cell-age">0:21:22</td>
        <td class="cell-graph">
          <div class="mini-graph" />
        </td>
        <td class="cell-actions">
          <SmallButton text="Liquidate" onclick={() => {}}></SmallButton>
        </td>
      </tr>
      <!--  -->
      <tr class="simple-row">
        <td class="cell-description"
          >This trip is volatile and churny; all interactions are fast and can swing balance
          quickly. Keep hands on controls.</td
        >
        <td class="cell-balance">200</td>
        <td class="cell-profit-loss">+1000</td>
        <td class="cell-age">0:21:22</td>
        <td class="cell-graph">
          <div class="mini-graph" />
        </td>
        <td class="cell-actions">
          <SmallButton text="Liquidate" onclick={() => {}}></SmallButton>
        </td>
      </tr>
      <!--  -->
      <tr class="simple-row">
        <td class="cell-description"
          >This trip is volatile and churny; all interactions are fast and can swing balance
          quickly. Keep hands on controls.</td
        >
        <td class="cell-balance">200</td>
        <td class="cell-profit-loss">+1000</td>
        <td class="cell-age">0:21:22</td>
        <td class="cell-graph">
          <div class="mini-graph" />
        </td>
        <td class="cell-actions">
          <SmallButton text="Liquidate" onclick={() => {}}></SmallButton>
        </td>
      </tr>
      <!--  -->
      <tr class="simple-row">
        <td class="cell-description"
          >This trip is volatile and churny; all interactions are fast and can swing balance
          quickly. Keep hands on controls.</td
        >
        <td class="cell-balance">200</td>
        <td class="cell-profit-loss">+1000</td>
        <td class="cell-age">0:21:22</td>
        <td class="cell-graph">
          <div class="mini-graph" />
        </td>
        <td class="cell-actions">
          <SmallButton text="Liquidate" onclick={() => {}}></SmallButton>
        </td>
      </tr>
    </tbody>
  </table>
</div>

<style lang="scss">
  .admin-trip-table-container {
    width: 100%;
    background: black;
    height: 200px;
    overflow-y: scroll;
  }
  .admin-trip-table {
    width: 100%;
    background: black;
    // table-layout: fixed;
    /* justify-content: center; */
    /* align-items: center; */
  }

  .mini-graph {
    width: 200px;
    height: 80px;
    background: red;
  }

  .simple-row {
    &:hover {
      background: #222;
      cursor: pointer;
    }
    td {
      overflow: hidden;
      margin: 0;
      vertical-align: top;
    }
    .cell-description {
      // min-width: 500px;
    }
    .cell-balance {
      width: 120px;
      background: red;
    }
    .cell-profit-loss {
      width: 120px;
    }
    .cell-age {
      width: 120px;
    }
    .cell-graph {
      max-width: 200px;
    }
    .cell-actions {
      max-width: 200px;
    }
  }
</style>
