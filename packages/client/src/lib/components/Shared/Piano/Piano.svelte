<!-- <script lang="ts">
  import { getMixerState } from "$lib/modules/sound/state.svelte"

  let mixer = getMixerState()

  let showJazz = $state(false)

  const solo = () => {
    if (mixer?.players?.mainSolo) {
      mixer?.stopMusic("mainSolo")
      mixer?.players.mainSolo.start()
    }
  }

  const playNote = (semitones: number) => {
    mixer?.setPitchShift("mainSolo", semitones)
    solo()
  }
</script>

<svelte:window onkeydown={() => (showJazz = true)} onkeyup={() => (showJazz = false)} />

<div class="tab">
  {#if showJazz}
    <div class="piano-keys">
      <button class="white-key" onclick={() => playNote(-12)}></button>
      <button class="black-key" onclick={() => playNote(-9)}></button>
      <button class="white-key" onclick={() => playNote(-6)}></button>
      <button class="black-key" onclick={() => playNote(-3)}></button>
      <button class="white-key" onclick={() => playNote(0)}></button>
      <button class="white-key" onclick={() => playNote(1)}></button>
      <button class="black-key" onclick={() => playNote(2)}></button>
      <button class="white-key" onclick={() => playNote(7)}></button>
      <button class="black-key" onclick={() => playNote(3)}></button>
      <button class="white-key" onclick={() => playNote(4)}></button>
      <button class="black-key" onclick={() => playNote(6)}></button>
      <button class="white-key" onclick={() => playNote(12)}></button>
    </div>
  {/if}
  <p class="key">Music volume</p>
  <input
    min="-100"
    max="0"
    type="range"
    name="music-volume"
    id="music-volume"
    value={mixer.channelStates.music.volume}
    oninput={e => {
      mixer.setChannelVolume("music", Number(e.target.value))
    }}
  />
  {mixer.channelStates.music.volume}dB
  <label>
    <input
      type="checkbox"
      bind:checked={mixer.channelStates.music.muted}
      onchange={e => mixer.setChannelMute("music", e.target.checked)}
    />
    Mute
  </label>
</div>

<style lang="scss">
  .tab {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;

    .key {
      width: 140px;
    }

    input[type="range"] {
      flex: 1;
      min-width: 100px;
    }

    label {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: var(--font-size-normal);
    }
  }

  .piano-keys {
    width: 300px;
    height: 60px;
    position: relative;
    display: flex;
    margin-bottom: 8px;

    .white-key {
      width: calc(300px / 7);
      height: 60px;
      background: white;
      border: none;
      cursor: pointer;
      border-style: outset;
      border-width: 4px;
      border-color: rgba(0, 0, 0, 0.2);

      &:hover {
        background: #f0f0f0;
      }
    }

    .black-key {
      width: calc(300px / 14);
      height: 24px;
      background: black;
      border: none;
      position: absolute;
      cursor: pointer;
      border-style: outset;
      border-width: 4px;
      border-color: rgba(0, 0, 0, 0.2);

      &:hover {
        background: #333;
      }

      &:nth-of-type(2) {
        left: calc(300px / 7 - 300px / 28);
      }
      &:nth-of-type(4) {
        left: calc(300px / 7 * 2 - 300px / 28);
      }
      &:nth-of-type(7) {
        left: calc(300px / 7 * 4 - 300px / 28);
      }
      &:nth-of-type(9) {
        left: calc(300px / 7 * 5 - 300px / 28);
      }
      &:nth-of-type(11) {
        left: calc(300px / 7 * 6 - 300px / 28);
      }
    }
  }
</style> -->
