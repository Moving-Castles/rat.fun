<script lang="ts">
  import {
    playerAddress,
    player,
    playerRat,
    rooms,
  } from "@modules/state/base/stores"
  import { UI } from "@modules/ui/enums"
  import { UIState } from "@modules/ui/stores"
  import { shortenAddress } from "@modules/utils"
  import {
    transferBalanceToPlayer,
    transferBalanceToRat,
  } from "@modules/action"
  import { waitForCompletion } from "@modules/action/actionSequencer/utils"

  import { ENVIRONMENT } from "@mud/enums"

  import RoomItem from "@components/Nest/RoomItem.svelte"
  import NewRoom from "@components/Nest/NewRoom.svelte"
  import Inventory from "@components/Nest/Inventory/Inventory.svelte"
  import LoadOut from "@components/Nest/LoadOut/LoadOut.svelte"
  import Traits from "@components/Nest/Traits/Traits.svelte"

  export let environment: ENVIRONMENT

  let busy = false

  async function sendTransferBalanceToPlayer() {
    busy = true
    const action = transferBalanceToPlayer(100)
    try {
      await waitForCompletion(action)
    } catch (e) {
      console.error(e)
    } finally {
      busy = false
    }
  }

  async function sendTransferBalanceToRat() {
    busy = true
    const action = transferBalanceToRat(100)
    try {
      await waitForCompletion(action)
    } catch (e) {
      console.error(e)
    } finally {
      busy = false
    }
  }

  function restart() {
    UIState.set(UI.CREATING_RAT)
  }
</script>

<div class="nest">
  <div class="column first">
    <!-- PLAYER STATS -->
    {#if $player}
      <div class="player-stats">
        <!-- RAT KEEPER ADDRESS -->
        <div class="stat-item">
          <div class="inner-wrapper rat-keeper">
            <div class="label">Rat keeper:</div>
            <div class="value">{$player.name}</div>
          </div>
        </div>
        <!-- RAT KEEPER BALANCE -->
        <div class="stat-item">
          <div class="inner-wrapper balance">
            <div class="label">Balance:</div>
            <div class="value">${$player?.balance ?? 0}</div>
          </div>
          {#if $player?.balance >= 100}
            <div class="action">
              <button disabled={busy} on:click={sendTransferBalanceToRat}>
                Send $100 to rat balance
              </button>
            </div>
          {/if}
        </div>
        <!-- INVENTORY -->
        <div class="stat-item">
          <Inventory />
        </div>
      </div>
    {/if}

    <!-- RAT STATS -->
    {#if $playerRat}
      <div class="rat-stats">
        <!-- RAT -->
        <div class="stat-item">
          <div class="inner-wrapper rat">
            <div class="label">Rat #{$playerRat.index}</div>
          </div>
        </div>
        <!-- HEALTH -->
        <div class="stat-item">
          <div class="inner-wrapper health">
            <div class="label">Health:</div>
            <div class="value">{$playerRat?.health ?? 0}</div>
          </div>
        </div>
        <!-- RAT BALANCE -->
        <div class="stat-item">
          <div class="inner-wrapper balance">
            <div class="label">Balance:</div>
            <div class="value">${$playerRat?.balance ?? 0}</div>
          </div>
          {#if $playerRat?.balance >= 100}
            <div class="action">
              <button disabled={busy} on:click={sendTransferBalanceToPlayer}>
                Send $100 to player balance
              </button>
            </div>
          {/if}
        </div>
        {#if !$playerRat?.dead}
          <!-- TRAITS -->
          <Traits />
          <!-- LOAD OUT -->
          <LoadOut />
        {:else}
          <div class="stat-item">
            <div class="inner-wrapper dead">
              <div class="label">RAT IS DEAD</div>
            </div>
          </div>
          <div class="restart">
            <button on:click={restart}>Get new rat</button>
          </div>
        {/if}
      </div>
    {/if}
  </div>

  <div class="column second">
    <NewRoom />
    <!-- ROOM LIST -->
    <div class="room-list">
      {#each Object.entries($rooms).reverse() as [roomId, room]}
        <RoomItem {environment} {roomId} {room} />
      {/each}
    </div>
  </div>
</div>

<style lang="scss">
  .stats {
    margin-bottom: 20px;
  }

  img {
    margin-bottom: 20px;
  }

  .column {
    width: 50%;
    height: 100vh;
    float: left;
    padding: 20px;
    overflow-x: hidden;
    overflow-y: auto;

    &.first {
      border-right: 1px solid var(--white);
    }
  }

  .trait {
    background: lightcyan;
    color: var(--black);
    display: flex;
    flex-wrap: wrap;
  }

  .image-container {
    position: relative;
    margin-top: 10px;

    .stamp {
      width: 400px;
      display: none;
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
    }

    &.dead {
      .rat {
        filter: grayscale(100%);
      }

      .stamp {
        display: block;
      }
    }
  }

  .restart {
    button {
      padding: 10px;
      background: var(--color-alert);
      font-size: var(--font-size-normal);
      cursor: pointer;
    }
  }

  .player-stats {
    border-bottom: 1px solid var(--white);
    padding-bottom: 10px;
    margin-bottom: 20px;
  }

  .rat-stats {
    border-bottom: 1px solid var(--white);
    padding-bottom: 10px;
    margin-bottom: 10px;
  }

  .stat-item {
    margin-bottom: 10px;
    display: flex;

    .label {
      margin-right: 0.5em;
    }

    .inner-wrapper {
      display: inline-flex;
      padding: 5px;

      &.balance {
        background: var(--color-value);
        color: var(--black);
      }

      &.rat-keeper {
        background: var(--color-alert);
        color: var(--black);
      }

      &.rat {
        background: var(--color-alert);
        color: var(--black);
      }

      &.health {
        background: var(--color-health);
        color: var(--black);
      }

      &.dead {
        background: var(--color-death);
        color: var(--white);
      }
    }
  }

  .action {
    button {
      padding: 5px;
      color: var(--black);
      cursor: pointer;
      margin-left: 20px;
    }
  }
</style>
