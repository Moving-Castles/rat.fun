import * as Tone from "tone"
import { writable } from "svelte/store"
import { soundLibrary } from "./sound-library"
import type { TimingOptions } from "./types"

export const music = writable(new Tone.Player())
export const fx = writable([new Tone.Player()])

let audioContextStarted = false

/**
 * Starts the Tone.js audio context after user interaction
 * Call this on first user click/touch to enable audio
 */
export async function startAudioContext(): Promise<boolean> {
  if (audioContextStarted) return true
  
  try {
    await Tone.start()
    audioContextStarted = true
    console.log("Audio context started after user gesture")
    return true
  } catch (error) {
    console.warn("Failed to start audio context:", error)
    return false
  }
}

/**
 * Initializes and preloads all sounds from the `tcm` property of the `soundLibrary` object.
 * This ensures that there's minimal delay when the sounds are played for the first time.
 *
 * @example
 * initSound();  // Preloads all the sounds in soundLibrary.tcm
 *
 * @returns {void}
 */
export async function initSound(): Promise<void> {
  // Try to start the audio context early, but don't fail if it requires user gesture
  try {
    await Tone.start()
    audioContextStarted = true
    console.log("Audio context started during init")
  } catch (error) {
    console.log("Audio context requires user gesture, will start later")
  }

  // Load sounds regardless of audio context state
  for (const key in soundLibrary.tcm) {
    try {
      console.log(`Loading TCM sound: ${key} from ${soundLibrary.tcm[key].src}`)
      const player = new Tone.Player(soundLibrary.tcm[key].src).toDestination()
      player.volume.value = soundLibrary.tcm[key].volume
      await player.load(soundLibrary.tcm[key].src)
      soundLibrary.tcm[key].sound = player
      console.log(`Successfully loaded TCM sound: ${key}`)
    } catch (error) {
      console.warn(`Failed to load TCM sound: ${key}`, error)
    }
  }
  for (const key in soundLibrary.ratfun) {
    try {
      console.log(`Loading ratfun sound: ${key} from ${soundLibrary.ratfun[key].src}`)
      const player = new Tone.Player(soundLibrary.ratfun[key].src).toDestination()
      player.volume.value = soundLibrary.ratfun[key].volume
      await player.load(soundLibrary.ratfun[key].src)
      soundLibrary.ratfun[key].sound = player
      console.log(`Successfully loaded ratfun sound: ${key}`)
    } catch (error) {
      console.warn(`Failed to load ratfun sound: ${key}`, error, soundLibrary.ratfun[key])
    }
  }
  
  console.log("Sound loading complete. Ratfun sounds:", Object.keys(soundLibrary.ratfun).map(key => ({ 
    key, 
    hasSound: !!soundLibrary.ratfun[key].sound,
    src: soundLibrary.ratfun[key].src
  })))
}

/**
 * Plays a sound based on category and id. Provides options for looping and fade effects.
 *
 * @export
 * @param {string} category - The category of the sound.
 * @param {string} id - The id of the sound within the category.
 * @param {boolean} [loop=false] - Determines if the sound should loop.
 * @param {boolean} [fade=false] - Determines if the sound should have fade in/out effects.
 * @param {number} [pitch=1] - The pitch of the sound.
 * @param {boolean} [play=true] - useful to just fetch the sound
 * @param {TimingOptions} [timing] - Advanced timing options for precise scheduling
 * @returns {Promise<Tone.Player | undefined>} - The Tone.js Player object of the sound.
 */
export async function playSound(
  category: string,
  id: string,
  loop: boolean = false,
  fade: boolean = false,
  pitch: number = 1,
  play: boolean = true,
  timing?: TimingOptions
): Promise<Tone.Player | undefined> {
  // Ensure Tone.js audio context is started
  if (!audioContextStarted) {
    const started = await startAudioContext()
    if (!started) {
      console.warn(`Cannot play sound ${category}.${id} - audio context not started`)
      return
    }
  }

  const soundEntry = soundLibrary[category]?.[id]
  const sound = soundEntry?.sound

  console.log("sound", category + " " + id, soundLibrary[category])
  console.log("soundEntry for", id, soundEntry)
  console.log("sound object for", id, sound)

  if (!sound) {
    console.warn(`Sound not found: ${category}.${id}. Available sounds:`, Object.keys(soundLibrary[category] || {}))
    if (soundEntry) {
      console.warn("Sound entry exists but .sound property is missing:", soundEntry)
    }
    return
  }

  // Check for placeholder sound
  if (sound.buffer && sound.buffer.numberOfChannels === 0) {
    console.warn(
      "It looks like you might be playing silence. Are you enjoying that? Information: (%o)",
      {
        category,
        id
      }
    )
  }

  // Set loop
  sound.loop = loop

  // Set playback rate (pitch)
  sound.playbackRate = pitch

  if (!play) {
    return sound
  }

  // Calculate timing
  const when = timing?.when || "+0"
  const duration = timing?.duration

  if (fade) {
    const FADE_TIME = timing?.fadeTime || 2000
    const fadeTimeInSeconds = FADE_TIME / 1000

    // Set initial volume to 0
    sound.volume.setValueAtTime(0, when)
    // Fade in to target volume
    sound.volume.rampTo(soundLibrary[category][id].volume, fadeTimeInSeconds, when)

    if (duration) {
      // Fade out at the end if duration is specified
      const endTime =
        typeof when === "string"
          ? when
          : when + (typeof duration === "number" ? duration / 1000 : 0)
      sound.volume.rampTo(0, fadeTimeInSeconds, endTime)
    }
  }

  try {
    sound.start(when, 0, duration)
  } catch (error) {
    console.warn(`Failed to play sound: ${category}.${id}`, error)
  }

  return sound
}
/**
 * @returns {number} - A random pitch
 */
export function randomPitch(): number {
  const max = 2
  const min = 0.8
  return Math.random() * (max - min) + min
}

export const typeHit = async () => {
  const sound = await playSound("ratfun", "type", false, false, randomPitch())
  if (sound) {
    sound.start()
  }
}
