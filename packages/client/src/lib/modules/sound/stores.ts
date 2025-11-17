import type { PlaySoundConfig } from "./types"
import { soundLibrary } from "./sound-library"

class BackgroundMusicManager {
  private currentHowl: import("howler").Howl | undefined
  private currentSoundId: number | undefined

  /**
   * Plays a background music track. Automatically stops any currently playing track.
   */
  play(config: PlaySoundConfig): void {
    // Stop any currently playing track first
    this.stop()

    const { category, id, loop = false, fadeIn = false, pitch = 1, volume } = config

    // Check if category exists
    if (!soundLibrary[category]) {
      console.warn(`Sound category "${category}" not found in sound library`)
      return
    }

    // Check if sound ID exists in category
    if (!soundLibrary[category][id]) {
      console.warn(`Sound "${id}" not found in category "${category}"`)
      return
    }

    const sound = soundLibrary[category][id].sound

    if (!sound) {
      console.warn(
        `Sound "${id}" in category "${category}" has not been initialized. Make sure to call initSound() first.`
      )
      return
    }

    // Set volume
    if (volume !== undefined) {
      sound.volume(volume)
    }

    // Set loop state
    sound.loop(loop)

    // Set pitch
    sound.rate(pitch)

    // Play sound and track the sound ID
    const soundId = sound.play() as number

    if (fadeIn && soundId !== undefined) {
      const FADE_TIME = 2000
      sound.fade(
        0,
        volume !== undefined ? volume : soundLibrary[category][id].volume,
        FADE_TIME,
        soundId
      )
    }

    // Store current playing track
    this.currentHowl = sound
    this.currentSoundId = soundId
  }

  /**
   * Stops the currently playing background music track.
   */
  stop(): void {
    if (this.currentHowl && this.currentSoundId !== undefined) {
      this.currentHowl.stop(this.currentSoundId)
      this.currentHowl = undefined
      this.currentSoundId = undefined
    }
  }
}

export const backgroundMusic = new BackgroundMusicManager()
