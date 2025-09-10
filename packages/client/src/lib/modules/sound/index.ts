import * as Tone from "tone"
import { soundLibrary } from "./sound-library"
import { getMixerState } from "./state.svelte"

/**
 * Plays a sound based on collection and id. Provides options for looping and fade effects.
 *
 * @export
 * @param {string} collection - The collection of the sound.
 * @param {string} id - The id of the sound within the collection.
 * @returns {Promise<Tone.Player | undefined>} - The Tone.js Player object of the sound.
 */
export async function playUISound(
  collection: string,
  id: string
): Promise<Tone.Player | undefined> {
  // This check just in case tone context hasn't started
  await Tone.start()

  const mixer = getMixerState()

  console.log("mixer channels", mixer.channels)

  if (mixer?.channels?.ui) {
    const sound = new Tone.Player({
      url: soundLibrary[collection][id].src,
      autostart: true
    }).connect(mixer.channels.ui)

    return sound
  }
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
  playUISound("ratfun", "type")
}
