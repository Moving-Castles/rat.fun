import * as Tone from "tone"
import { getMixerState } from "../state.svelte"

const make = (note: string) => {
  let mixer = getMixerState()

  if (!mixer.channels.ui) throw new Error("Not ready")

  const frequency = Tone.Frequency(note).toFrequency()

  // Reverb for spatial effect
  const reverb = new Tone.Reverb({
    decay: 2,
    wet: 1
  }).connect(mixer.channels.ui)

  // Envelope for attack/decay
  const env = new Tone.AmplitudeEnvelope({
    attack: 0.001,
    decay: 1.5,
    sustain: 0,
    release: 0.1
  }).connect(reverb)

  // Simple plucked string using Karplus-Strong-inspired method - more tinny
  const pluckedString = new Tone.Oscillator({
    type: "square", // More tinny than sawtooth
    frequency: note,
    detune: Math.random() * 40 - 20 // Random detune ±20 cents
  }).chain(
    new Tone.Filter({
      type: "highpass", // Changed to highpass for tinny sound
      frequency: 800,
      rolloff: -12
    }),
    new Tone.Filter({
      type: "lowpass",
      frequency: 3000, // Higher cutoff for more brightness
      rolloff: -12
    }),
    new Tone.FeedbackDelay({
      delayTime: 1 / Tone.Frequency(note).toFrequency(),
      feedback: 0.2
    }),
    reverb
  )

  return {
    pluckedString,
    env
  }

  // Key elements from the article applied:
  // - Sharp attack (0.001s) mimics the pluck
  // - Lowpass filter removes high frequencies over time
  // - Feedback delay simulates string resonance
  // - Quick decay envelope matches plucked string behavior
}

// 25-step diminished/chromatic scale - scary/erratic sounding
const scaryScale = [
  "C3",
  "Db3",
  "D3",
  "Eb3",
  "E3",
  "F3",
  "Gb3",
  "G3",
  "Ab3",
  "A3",
  "Bb3",
  "B3",
  "C4",
  "Db4",
  "D4",
  "Eb4",
  "E4",
  "F4",
  "Gb4",
  "G4",
  "Ab4",
  "A4",
  "Bb4",
  "B4",
  "C5"
]

export const playSample = (scale: number) => {
  try {
    // Map scale (0-1) to scary scale index (25 steps)
    const noteIndex = Math.floor(scale * (scaryScale.length - 1))
    const note = scaryScale[noteIndex]

    const { pluckedString, env } = make(note)

    pluckedString.start()
    env.triggerAttackRelease(0.2)

    // Cleanup after the envelope finishes (attack + decay + release)
    setTimeout(
      () => {
        pluckedString.dispose()
        env.dispose()
      },
      (0.001 + 1.5 + 0.1) * 1000 + 100
    ) // Add 100ms buffer
  } catch (error) {
    console.warn(error)
  }
}
