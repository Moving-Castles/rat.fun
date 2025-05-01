<script lang="ts">
  import { playerId } from "@modules/state/base/stores"
  const { id, player, index }: { id: string; player: Player; index: number } =
    $props()
</script>

<div class="highscore-item" class:player={id === $playerId}>
  <div class="rank">{index + 1}</div>
  <div class="name">{player.name}</div>
  <div class="balance">${player.balance}</div>
</div>

<style lang="scss">
  .highscore-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 10px;
    padding-bottom: 10px;
    border-bottom: var(--default-border-style);

    .balance {
      background: var(--color-value);
      color: var(--black);
      padding: 5px;
    }

    .name {
      padding: 5px;
    }

    &.player {
      .name {
        background: var(--color-alert);
        color: var(--black);
      }
    }
  }
</style>
