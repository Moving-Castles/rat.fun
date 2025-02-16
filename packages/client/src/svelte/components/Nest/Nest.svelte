<script lang="ts">
  import {
    player,
    rat,
    ratLevel,
    roomsOnRatLevel,
    ratInventory,
    ratTotalValue,
    playerInventory,
  } from "@modules/state/base/stores"
  import { UI } from "@modules/ui/enums"
  import { UIState } from "@modules/ui/stores"
  import {
    transferBalanceToPlayer,
    transferBalanceToRat,
    levelUp,
  } from "@modules/action"
  import { waitForCompletion } from "@modules/action/actionSequencer/utils"
  import { shortenAddress } from "@modules/utils"

  import { ENVIRONMENT } from "@mud/enums"
  import { EMPTY_CONNECTION } from "@modules/utils/constants"
  import { initOffChainSync } from "@modules/off-chain-sync"

  import RoomItem from "@components/Room/RoomItem.svelte"
  import NewRoom from "@components/Room/NewRoom.svelte"
  import Inventory from "@components/Nest/Inventory/Inventory.svelte"
  import Traits from "@components/Nest/Traits/Traits.svelte"
  import NestView from "@components/Nest/NestView/NestView.svelte"
  import ClientStats from "@components/Elements/ClientStats/ClientStats.svelte"
  import Admin from "@components/Admin/Admin.svelte"

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

  async function sendLevelUp() {
    busy = true
    const action = levelUp()
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

  // Wait for the player to have a rat before initializing off-chain sync
  $: if ($player.ownedRat) {
    initOffChainSync(environment, $player.ownedRat)
  }
</script>

<Admin />
<ClientStats />

<div class="nest">
  <div class="column first">
    <!-- PLAYER STATS -->
    {#if $player}
      <div class="player-stats">
        <!-- RAT KEEPER ADDRESS -->
        <div class="stat-item">
          <div class="inner-wrapper rat-keeper">
            <div class="label">Operator:</div>
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
        <!-- PLAYER INVENTORY -->
        <div class="stat-item">
          <Inventory
            inventory={$playerInventory}
            itemKeys={$player.inventory}
          />
        </div>
      </div>
    {/if}

    <!-- RAT STATS -->
    {#if $rat}
      <div class="rat-stats">
        <!-- RAT -->
        <div class="stat-item">
          <div class="inner-wrapper rat">
            <div class="label">Rat: {$rat.name}</div>
          </div>
        </div>
        <!-- RAT ID-->
        <div class="stat-item">
          <div class="inner-wrapper">
            <div class="label">ID: {shortenAddress($player.ownedRat)}</div>
          </div>
        </div>
        <!-- Wating in room -->
        {#if $rat.waitingInRoom && $rat.waitingInRoom !== EMPTY_CONNECTION}
          <div class="stat-item">
            <div class="inner-wrapper rat">
              <div class="label">Waiting in room</div>
              <div class="value">{shortenAddress($rat.waitingInRoom)}</div>
            </div>
          </div>
        {/if}
        <!-- LEVEL-->
        <div class="stat-item">
          <div class="inner-wrapper rat">
            <div class="label">Level:</div>
            <div class="value">{$ratLevel?.index ?? 0}</div>
            <div class="action">
              <button
                disabled={busy || $rat.balance < ($ratLevel?.levelUpCost ?? 0)}
                on:click={sendLevelUp}
              >
                Level up (costs ${$ratLevel?.levelUpCost ?? 0})
              </button>
            </div>
          </div>
        </div>
        <!-- HEALTH -->
        <div class="stat-item">
          <div class="inner-wrapper health">
            <div class="label">Health:</div>
            <div class="value">{$rat?.health ?? 0}</div>
          </div>
        </div>
        <!-- RAT BALANCE -->
        <div class="stat-item">
          <div class="inner-wrapper balance">
            <div class="label">Balance:</div>
            <div class="value">${$rat?.balance ?? 0}</div>
          </div>
          {#if $rat?.balance >= 100}
            <div class="action">
              <button disabled={busy} on:click={sendTransferBalanceToPlayer}>
                Send $100 to player balance
              </button>
            </div>
          {/if}
        </div>
        <!-- RAT TOTAL VALUE -->
        <div class="stat-item">
          <div class="inner-wrapper">
            <div class="label">Total value:</div>
            <div class="value">${$ratTotalValue ?? 0}</div>
          </div>
        </div>
        {#if !$rat?.dead}
          <!-- TRAITS -->
          <Traits />
          <!-- RAT INVENTORY -->
          <Inventory
            isRat
            inventory={$ratInventory}
            itemKeys={$rat.inventory}
          />
          <!-- NEST VIEW -->
          <NestView />
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
    <div class="level">
      <h2>Level: {$ratLevel?.index ?? 0}</h2>
    </div>
    <!-- CREATE ROOM-->
    <!-- {#if ($ratLevel?.index ?? 0) > 1} -->
    <NewRoom />
    <!-- {/if} -->
    <!-- ROOM LIST -->
    <div class="room-list">
      {#each Object.entries($roomsOnRatLevel).reverse() as [roomId, room]}
        <RoomItem {environment} {roomId} {room} />
      {/each}
    </div>
  </div>
</div>

<style lang="scss">
  .column {
    width: 50%;
    height: 100vh;
    float: left;
    padding: 20px;
    overflow-x: hidden;
    overflow-y: auto;
    padding-top: 60px;

    &.first {
      border-right: 1px solid var(--white);
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
