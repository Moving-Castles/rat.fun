import type { PlaySoundConfig } from "./types"
import { soundLibrary } from "./sound-library"
import { LocalStorage } from "$lib/modules/state/local.svelte"

// Store for tracking if music is enabled (persisted to localStorage)
export const musicEnabled = new LocalStorage<boolean>("musicEnabled", true)

class BackgroundMusicManager {
  private currentHowl: import("howler").Howl | undefined
  private currentSoundId: number | undefined
  private intendedConfig: PlaySoundConfig | undefined

  /**
   * Plays a background music track. Automatically stops any currently playing track.
   */
  play(config: PlaySoundConfig): void {
    // Store the intended config so we can resume if music is re-enabled
    this.intendedConfig = config

    // Check if music is enabled before playing
    // EXCEPTION for trip processing "music"
    if (!musicEnabled.current && !config.id.toLowerCase().includes("processing")) {
      return
    }

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

  /**
   * Resumes the intended music track if music is enabled and a track was previously set.
   */
  resume(): void {
    if (musicEnabled.current && this.intendedConfig) {
      // Re-play the intended config without storing it again (avoid recursion)
      const config = this.intendedConfig

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
  }
}

export const backgroundMusic = new BackgroundMusicManager()
