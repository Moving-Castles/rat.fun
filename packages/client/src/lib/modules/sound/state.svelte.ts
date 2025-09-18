import { get } from "svelte/store"
import type { Snapshot } from "./$types"
import * as Tone from "tone"
import { soundLibrary } from "$lib/modules/sound/sound-library"
import { page } from "$app/state"
import { player } from "$lib/modules/state/stores"

export type ChannelConfig = {
  volume: number
  muted: boolean
  solo: boolean
  pan: number
}

let channelStates = $state<Record<string, ChannelConfig>>({
  ui: { volume: 0, muted: false, solo: false, pan: 0 },
  music: { volume: 0, muted: false, solo: false, pan: 0 }
})
let uiChannel = $state<Tone.InputNode>()
let musicChannel = $state<Tone.InputNode>()
let channels = $state<Record<string, Tone.Channel>>({})
let pitchShifters = $state<Record<string, Tone.PitchShift>>({})
let players = $state<Record<string, Tone.Player>>()
let currentlyPlaying = $state<string | null>(null)
let toneLoaded = $state(false)
let masterVolume = $state(0)
let mixerInstance: ReturnType<typeof createMixerState> | null = $state(null)

const setPlayers = (newPlayersState: Record<string, Tone.Player>) => {
  players = newPlayersState
}

const setChannelStates = states => {
  channelStates = states
}

const setChannelVolume = (channel: string, volume: number) => {
  if (channelStates[channel] && channelStates[channel].volume !== volume) {
    channelStates[channel].volume = volume
    updateChannelVolume(channel)
  }
}

const setChannelMute = (channel: string, muted: boolean) => {
  if (channelStates[channel]) {
    channelStates[channel].muted = muted
    updateChannelVolume(channel)
  }
}

const setChannelSolo = (channel: string, solo: boolean) => {
  if (channelStates[channel]) {
    channelStates[channel].solo = solo
    updateAllChannelVolumes()
  }
}

const setMasterVolume = (volume: number) => {
  masterVolume = volume
  if (Tone.getDestination()) {
    Tone.getDestination().volume.value = volume
  }
}

/**
 *
 * @param channel
 * @returns
 */
const updateChannelVolume = (channel: string) => {
  const state = channelStates[channel]
  const toneChannel = channels[channel]

  if (!toneChannel) return

  const anySolo = Object.values(channelStates).some(s => s.solo)

  const isAudible = !anySolo || state.solo
  const isMuted = state.muted

  if (isMuted || !isAudible) {
    toneChannel.mute = true
  } else {
    toneChannel.mute = false
    toneChannel.volume.value = state.volume
  }
}

const registerChannel = (name: string, channel: Tone.ToneAudioNode) => {
  channels[name] = channel
  if (!channelStates[name]) {
    channelStates[name] = { volume: 0, muted: false, solo: false, pan: 0 }
  }
  updateChannelVolume(name)
}

const updateAllChannelVolumes = () => {
  // Only update if we have channels to avoid unnecessary work
  if (Object.keys(channels).length === 0) return
  Object.keys(channelStates).forEach(updateChannelVolume)
}

const stopAllMusic = () => {
  if (players) {
    Object.values(players).forEach(player => {
      if (player.state !== "stopped") {
        player.stop()
      }
    })
  }
  currentlyPlaying = null
}

const startMusic = (key: string) => {
  if (players && players[key] && currentlyPlaying !== key) {
    stopAllMusic()
    console.log("start music ", key)
    players[key].start()
    currentlyPlaying = key
  }
}

const stopMusic = (key: string) => {
  if (players && players[key]) {
    players[key].stop()
    if (currentlyPlaying === key) {
      currentlyPlaying = null
    }
  }
}

const setPitchShift = (playerKey: string, semitones: number) => {
  if (pitchShifters[playerKey]) {
    pitchShifters[playerKey].pitch = semitones
  }
}

const registerMusic = (channel: Tone.ToneAudioNode): Record<string, Tone.Player> => {
  // Looping music ONLY
  // Spawn
  const spawn = new Tone.Player({
    url: soundLibrary.ratfun.mainOld.src,
    loop: true,
    fadeIn: 3,
    fadeOut: 1,
    volume: -18,
    autostart: false
  })
    .chain(channel)
    .sync()

  const main = new Tone.Player({
    url: soundLibrary.ratfun.main.src,
    loop: true,
    fadeIn: 3,
    fadeOut: 1,
    volume: -18,
    autostart: false
  })
    .chain(channel)
    .sync()

  // Main solo
  const mainSoloPitchShift = new Tone.PitchShift()
  const mainSolo = new Tone.Player({
    url: soundLibrary.ratfun.upwardspiral.src,
    loop: false,
    fadeOut: 1,
    volume: -18,
    autostart: false
  })
    .chain(mainSoloPitchShift, channel)
    .sync()

  pitchShifters.mainSolo = mainSoloPitchShift

  // Admin
  const admin = new Tone.Player({
    url: soundLibrary.ratfun.admin.src,
    loop: true,
    autostart: false
  })
    .connect(channel)
    .sync()

  // Non-looping music

  // Trip setup
  const tripSetup = new Tone.Player({
    url: soundLibrary.ratfun.tripSetup.src,
    volume: -Infinity,
    loop: false,
    autostart: false
  })
    .connect(channel)
    .sync()

  const tripProcessing = new Tone.Player({
    url: soundLibrary.ratfun.tripProcessing.src,
    volume: -Infinity,
    loop: false,
    autostart: false
  })
    .connect(channel)
    .sync()

  const tripResultGood = new Tone.Player({
    url: soundLibrary.ratfun.tripResultGood.src,
    volume: -Infinity,
    loop: false,
    autostart: false
  })
    .connect(channel)
    .sync()

  const result = {
    main,
    mainSolo,
    admin,
    spawn,
    tripSetup,
    tripProcessing,
    tripResultGood
  }

  Tone.loaded().then(done => {
    console.log("TONE LOADED")
    console.log(done)
    toneLoaded = true
    switchAudio(page)
  })

  return result
}

const getMusicForRoute = (route: Partial<import("@sveltejs/kit").Page>) => {
  if (route?.route?.id?.includes("admin")) {
    return "admin"
  } else if (route?.url?.pathname.includes("result")) {
    return null // Stop all music for results
  } else if (route?.route?.id?.includes("(game)")) {
    return "main"
  }

  return null
}

export async function switchAudio(
  to: Partial<import("@sveltejs/kit").Page>,
  from?: Partial<import("@sveltejs/kit").Page>
) {
  if (!toneLoaded || !players) return

  let targetMusic = null

  if (!get(player)) {
    stopAllMusic()
    targetMusic = "spawn"
  } else {
    targetMusic = getMusicForRoute(to)
  }

  // Only change music if we're switching to something different
  if (currentlyPlaying !== targetMusic) {
    if (targetMusic === null) {
      stopAllMusic()
    } else {
      stopAllMusic()
      startMusic(targetMusic)
    }
  }
}

// Initialise the sound
export async function initSound(): Promise<void> {
  try {
    await Tone.start()

    Tone.setContext(new Tone.Context({ latencyHint: "playback" })) // for better performance

    // Initialize mixer if not already created
    if (!mixerInstance) {
      mixerInstance = createMixerState()
    }

    // Set up master volume
    Tone.getDestination().volume.value = masterVolume
    Tone.getTransport().start()

    // Create and register Music channel
    musicChannel = new Tone.Channel().toDestination()
    registerChannel("music", musicChannel)

    // Create and register UI channel
    uiChannel = new Tone.Channel().toDestination()
    registerChannel("ui", uiChannel)

    // Register the music players and apply them to the music channel
    const musicPlayers = registerMusic(musicChannel)
    setPlayers(musicPlayers)

    // @todo: Try to play the correct music based on the current page
    if (players) {
      // Try to start appropriate music based on current page
    }

    // We will use the individual players to change play state
  } catch (error) {}
}

export const snapshotFactory = (): Snapshot => {
  return {
    capture: () => {
      return {
        channelStates
      }
    },
    restore: value => {
      setChannelStates(value?.channelStates)
    }
  }
}

const createMixerState = () => {
  return {
    // Channel controls
    registerChannel,
    setChannelStates,
    setPlayers,
    setChannelVolume,
    setChannelMute,
    setChannelSolo,
    stopAllMusic,
    startMusic,
    stopMusic,
    setPitchShift,
    // Master control
    setMasterVolume,
    get loaded() {
      return toneLoaded
    },
    get channels() {
      return channels
    },
    get players() {
      return players
    },
    get channelStates() {
      return channelStates
    },
    get masterVolume() {
      return masterVolume
    },
    get currentlyPlaying() {
      return currentlyPlaying
    }
  }
}

export const getMixerState = () => {
  if (!mixerInstance) {
    mixerInstance = createMixerState()
  }
  return mixerInstance
}
