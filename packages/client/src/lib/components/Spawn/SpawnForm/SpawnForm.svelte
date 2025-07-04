<script lang="ts">
  import { busy, sendSpawn } from "$lib/modules/action-manager/index.svelte"
  import gsap from "gsap"
  import { onMount } from "svelte"
  import { BigButton } from "$lib/components/Shared"
  import { typeHit } from "$lib/modules/sound"
  import { VideoLoader } from "$lib/components/Shared"

  const { onComplete = () => {} } = $props<{
    onComplete: (name: string) => void
  }>()

  let name = $state("")
  let imageElement: HTMLImageElement | null = $state(null)
  let buttonElement: HTMLDivElement | null = $state(null)
  let textElement: HTMLDivElement | null = $state(null)
  const timeline = gsap.timeline()

  async function submitForm() {
    await sendSpawn(name)
    onComplete()
  }

  onMount(() => {
    if (!buttonElement || !textElement || !imageElement) return

    // Set initial opacity to 0
    imageElement.style.opacity = "0"
    buttonElement.style.opacity = "0"
    textElement.style.opacity = "0"

    timeline.to(imageElement, {
      opacity: 1,
      duration: 0.4,
      delay: 0.4
    })
    timeline.to(textElement, {
      opacity: 1,
      duration: 0.4
    })
    timeline.to(buttonElement, {
      opacity: 1,
      duration: 0.4
    })
  })
</script>

<div class="outer-container">
  <div class="inner-container">
    {#if busy.Spawn.current > 0}
      <VideoLoader progress={busy.Spawn} />
    {:else}
      <img class="image" src="/images/bouncer3.png" alt="RAT.FUN" bind:this={imageElement} />
      <!-- INTRO TEXT -->
      <div class="text" bind:this={textElement}>
        <!-- <p>OK {shortenAddress($playerAddress)}</p> -->
        <p>ID checks out. You can enter. But we need your name to proceed.</p>
      </div>

      <!-- FORM -->
      <div class="form" bind:this={buttonElement}>
        <!-- INPUT -->
        <input
          type="text"
          placeholder="YOUR NAME"
          bind:value={name}
          oninput={typeHit}
          onkeydown={e => e.key === "Enter" && submitForm()}
        />
        <BigButton text="SIGN" onclick={submitForm} disabled={!name} />
      </div>
    {/if}
  </div>
</div>

<style lang="scss">
  .outer-container {
    display: flex;
    flex-flow: column nowrap;
    height: var(--game-window-height);
    align-items: center;
    justify-content: center;

    .inner-container {
      display: flex;
      flex-flow: column nowrap;
      align-items: center;
      justify-content: center;
      width: 500px;

      .image {
        width: 100%;
      }

      .form {
        display: flex;
        width: 100%;

        input {
          height: 4em;
          width: 300px;
          margin-right: 10px;
          font-size: 18px;
          padding: 10px;
          background: var(--color-alert);
          color: var(--background);
          border: none;
          margin-bottom: 0.5em;
          font-family: "Rock Salt", cursive;
          text-transform: uppercase;
          border-bottom: var(--default-border-style);
          outline: none;

          &::placeholder {
            color: var(--color-grey-dark);
          }
        }
      }
    }
  }
</style>
