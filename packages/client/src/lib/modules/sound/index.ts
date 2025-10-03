import { Howl } from "howler"
import { soundLibrary } from "$lib/modules/sound/sound-library"
import type { SoundAssets } from "./types"

/**
 * Preloads a sound library by creating Howl instances for each sound.
 * This ensures that there's minimal delay when the sounds are played for the first time.
 *
 * @param {SoundAssets} library - The sound library object to preload
 * @returns {void}
 */
function preloadSoundLibrary(library: SoundAssets): void {
  for (const key in library) {
    library[key].sound = new Howl({
      src: [library[key].src],
      volume: library[key].volume,
      preload: true
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
 * @param {string} category - The category of the sound.
 * @param {string} id - The id of the sound within the category.
 * @param {boolean} [loop=false] - Determines if the sound should loop.
 * @param {boolean} [fade=false] - Determines if the sound should have fade in/out effects.
 * @param {number} [pitch=1] - The pitch of the sound.
 * @returns {Howl | undefined} - The Howl object of the sound.
 */
export function playSound(
  category: string,
  id: string,
  loop: boolean = false,
  fade: boolean = false,
  pitch: number = 1,
  play: boolean = true // useful to just fetch the sound
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

  if (loop) {
    sound.loop(true)
  }

  if (fade) {
    // Fade on begin and end
    const FADE_TIME = 2000

    // Init
    sound.rate(pitch)
    if (play) {
      sound.play()
      sound.fade(0, soundLibrary[category][id].volume, FADE_TIME)
    }
  } else {
    sound.rate(pitch)
    if (play) {
      sound.play()
    }
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
  playSound("ratfunUI", "type")
}
