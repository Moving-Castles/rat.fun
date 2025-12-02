import { Howl } from "howler"
import { soundLibrary } from "$lib/modules/sound/sound-library"
import type { SoundAssets, PlaySoundConfig } from "./types"

export type { PlaySoundConfig }

/**
 * Preloads a sound library by creating Howl instances for each sound.
 * This ensures that there's minimal delay when the sounds are played for the first time.
 *
 * Forces Web Audio API usage to avoid iOS HTML5 Audio element limits (~20-30 elements).
 *
 * @param {SoundAssets} library - The sound library object to preload
 * @returns {void}
 */
function preloadSoundLibrary(library: SoundAssets): void {
  for (const key in library) {
    library[key].sound = new Howl({
      src: [library[key].src],
      volume: library[key].volume,
      preload: true,
      html5: false // Force Web Audio API to avoid iOS HTML5 Audio pool exhaustion
    })
  }
}

/**
 * Initializes and preloads all sounds from the sound library.
 * This ensures that there's minimal delay when the sounds are played for the first time.
 *
 * @example
 * initSound();  // Preloads all the sounds in soundLibrary
 *
 * @returns {void}
 */
export function initSound(): void {
  preloadSoundLibrary(soundLibrary.ratfunUI)
  preloadSoundLibrary(soundLibrary.ratfunMusic)
  preloadSoundLibrary(soundLibrary.ratfunTransitions)
}

/**
 * Plays a sound based on category and id. Provides options for looping and fade effects.
 *
 * @export
 * @param {PlaySoundConfig} config - Configuration object for playing the sound
 * @returns {Howl | undefined} - The Howl object of the sound.
 */
export function playSound(config: PlaySoundConfig): Howl | undefined {
  const { category, id, loop = false, fadeIn = false, pitch = 1, volume } = config

  // Check if category exists
  if (!soundLibrary[category]) {
    console.warn(`Sound category "${category}" not found in sound library`)
    return undefined
  }

  // Check if sound ID exists in category
  if (!soundLibrary[category][id]) {
    console.warn(`Sound "${id}" not found in category "${category}"`)
    return undefined
  }

  const sound = soundLibrary[category][id].sound

  if (!sound) {
    console.warn(
      `Sound "${id}" in category "${category}" has not been initialized. Make sure to call initSound() first.`
    )
    return undefined
  }

  // Set volume
  if (volume !== undefined) {
    sound.volume(volume)
  }

  // Set loop state
  sound.loop(loop)

  // Set pitch
  sound.rate(pitch)

  // Play sound
  sound.play()

  if (fadeIn) {
    const FADE_TIME = 2000
    sound.fade(0, volume !== undefined ? volume : soundLibrary[category][id].volume, FADE_TIME)
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

export const typeHit = () => {
  playSound({ category: "ratfunUI", id: "type" })
}
