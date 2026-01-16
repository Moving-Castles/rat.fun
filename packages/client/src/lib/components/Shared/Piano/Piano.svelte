<script lang="ts">
  import { createLogger } from "$lib/modules/logger"

  const logger = createLogger("[Piano]")

  let audioContext: AudioContext | null = $state(null)
  let showPiano = $state(false)

  // Note frequencies for a simple piano (C4 to C5 with sharps/flats)
  const BASE_FREQUENCY = 261.63 // C4

  // Convert semitones to frequency
  const semitonesToFrequency = (semitones: number): number => {
    return BASE_FREQUENCY * Math.pow(2, semitones / 12)
  }

  const initAudio = () => {
    if (!audioContext) {
      audioContext = new AudioContext()
    }
    return audioContext
  }

  const playNote = (semitones: number) => {
    const ctx = initAudio()

    // Create oscillator for the note
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()

    oscillator.type = "sine"
    oscillator.frequency.setValueAtTime(semitonesToFrequency(semitones), ctx.currentTime)

    // Envelope for a nice piano-like attack/decay
    gainNode.gain.setValueAtTime(0, ctx.currentTime)
    gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.01)
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5)

    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)

    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + 0.5)

    logger.debug("Playing note:", { semitones, frequency: semitonesToFrequency(semitones) })
  }

  // Keyboard mapping for playing with computer keyboard
  const keyMap: Record<string, number> = {
    a: -12, // C3
    w: -11, // C#3
    s: -10, // D3
    e: -9, // D#3
    d: -8, // E3
    f: -7, // F3
    t: -6, // F#3
    g: -5, // G3
    y: -4, // G#3
    h: -3, // A3
    u: -2, // A#3
    j: -1, // B3
    k: 0, // C4
    o: 1, // C#4
    l: 2, // D4
    p: 3, // D#4
    ";": 4 // E4
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.repeat) return
    showPiano = true

    const semitones = keyMap[e.key.toLowerCase()]
    if (semitones !== undefined) {
      playNote(semitones)
    }
  }

  const handleKeyUp = () => {
    showPiano = false
  }

  // Cleanup audio context on unmount
  $effect(() => {
    return () => {
      if (audioContext) {
        audioContext.close()
        audioContext = null
      }
    }
  })
</script>

<svelte:window onkeydown={handleKeyDown} onkeyup={handleKeyUp} />

<div class="piano-container">
  {#if showPiano}
    <div class="piano-keys">
      <button class="white-key" onclick={() => playNote(-12)}>C</button>
      <button class="black-key black-1" onclick={() => playNote(-11)} aria-label="C sharp"></button>
      <button class="white-key" onclick={() => playNote(-10)}>D</button>
      <button class="black-key black-2" onclick={() => playNote(-9)} aria-label="D sharp"></button>
      <button class="white-key" onclick={() => playNote(-8)}>E</button>
      <button class="white-key" onclick={() => playNote(-7)}>F</button>
      <button class="black-key black-3" onclick={() => playNote(-6)} aria-label="F sharp"></button>
      <button class="white-key" onclick={() => playNote(-5)}>G</button>
      <button class="black-key black-4" onclick={() => playNote(-4)} aria-label="G sharp"></button>
      <button class="white-key" onclick={() => playNote(-3)}>A</button>
      <button class="black-key black-5" onclick={() => playNote(-2)} aria-label="A sharp"></button>
      <button class="white-key" onclick={() => playNote(-1)}>B</button>
      <button class="white-key" onclick={() => playNote(0)}>C</button>
    </div>
    <p class="hint">Press any key to show piano. Use A-L keys to play notes.</p>
  {/if}
</div>

<style lang="scss">
  .piano-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }

  .piano-keys {
    width: 364px;
    height: 120px;
    position: relative;
    display: flex;
    background: #222;
    padding: 4px;
    border-radius: 4px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }

  .white-key {
    width: 52px;
    height: 112px;
    background: linear-gradient(to bottom, #fff 0%, #f5f5f5 100%);
    border: 1px solid #ccc;
    border-radius: 0 0 4px 4px;
    cursor: pointer;
    font-size: 10px;
    color: #999;
    display: flex;
    align-items: flex-end;
    justify-content: center;
    padding-bottom: 4px;
    transition: background 0.05s;

    &:hover {
      background: linear-gradient(to bottom, #f0f0f0 0%, #e5e5e5 100%);
    }

    &:active {
      background: linear-gradient(to bottom, #e0e0e0 0%, #d5d5d5 100%);
    }
  }

  .black-key {
    width: 32px;
    height: 70px;
    background: linear-gradient(to bottom, #333 0%, #000 100%);
    border: none;
    border-radius: 0 0 3px 3px;
    position: absolute;
    top: 4px;
    cursor: pointer;
    z-index: 1;
    transition: background 0.05s;

    &:hover {
      background: linear-gradient(to bottom, #444 0%, #111 100%);
    }

    &:active {
      background: linear-gradient(to bottom, #555 0%, #222 100%);
    }

    &.black-1 {
      left: calc(52px - 16px + 4px);
    }
    &.black-2 {
      left: calc(52px * 2 - 16px + 4px);
    }
    &.black-3 {
      left: calc(52px * 4 - 16px + 4px);
    }
    &.black-4 {
      left: calc(52px * 5 - 16px + 4px);
    }
    &.black-5 {
      left: calc(52px * 6 - 16px + 4px);
    }
  }

  .hint {
    font-size: var(--font-size-small, 12px);
    color: var(--color-text-secondary, #888);
    margin: 0;
  }
</style>
