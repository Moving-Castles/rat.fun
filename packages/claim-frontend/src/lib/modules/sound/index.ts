import { Howl } from "howler"
import { soundLibrary } from "$lib/modules/sound/sound-library"
import type { SoundAssets } from "./types"

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
}

/**
 * Plays a sound based on category and id. Provides options for looping and fade effects.
 *
 * @export
 * @param {string} category - The category of the sound.
 * @param {string} id - The id of the sound within the category.
 * @param {boolean} [loop=false] - Determines if the sound should loop.
 * @param {boolean} [fadeIn=false] - Determines if the sound should have fade in/out effects.
 * @param {number} [pitch=1] - The pitch of the sound.
 * @param {number} [delay=0] - The delay in milliseconds before the sound is played.
 * @param {number | undefined} [volume=undefined] - The volume of the sound.
 * @returns {Howl | undefined} - The Howl object of the sound.
 */
export function playSound(
  category: string,
  id: string,
  loop: boolean = false,
  fadeIn: boolean = false,
  pitch: number = 1,
  delay: number = 0,
  volume: number | undefined = undefined
): Howl | undefined {
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

  // Handle play timing and fade effects
  const playWithDelay = () => {
    sound.play()
    if (fadeIn) {
      const FADE_TIME = 2000
      sound.fade(0, volume !== undefined ? volume : soundLibrary[category][id].volume, FADE_TIME)
    }
  }

  if (delay > 0) {
    setTimeout(playWithDelay, delay)
  } else {
    playWithDelay()
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
