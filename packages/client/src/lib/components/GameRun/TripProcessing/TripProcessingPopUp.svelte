<script lang="ts">
  import * as transitions from "svelte/transition"

  let { type }: { type: "first" | "second" | "third" } = $props()
</script>

<div
  in:transitions.scale|global={{ duration: 1500, opacity: 1 }}
  out:transitions.fade={{ duration: 300 }}
  class="popup"
>
  {#if type === "first"}
    <div>
      ALL IS FINE.<br /> JUST ONE MOMENT.<br /> WE VALUE YOUR PATIENCE.
    </div>
  {:else if type === "second"}
    <div>
      RAT STILL IN HALLUCINATORY STATE.<br />PLEASE STAND BY...
    </div>
  {:else if type === "third"}
    <div>RAT BEING REVIVED FROM DEEP DRUG INDUCED COMA...</div>
  {/if}
</div>

<style lang="scss">
  .popup {
    position: fixed;
    top: 0;
    left: 0;
    width: 100dvw;
    height: 100dvh;
    color: white;
    display: flex;
    flex-flow: column nowrap;
    justify-content: center;
    align-items: center;
    text-align: center;
    z-index: var(--z-modal);
    div {
      font-family: var(--special-font-stack);
      font-size: 10dvw;
      line-height: 0.8em;
    }
  }
</style>
