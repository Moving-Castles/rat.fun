import type { Snapshot } from "./$types"
import * as Tone from "tone"
import { soundLibrary } from "$lib/modules/sound/sound-library"
import { page } from "$app/state"

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
let players = $state<Record<string, Tone.Player>>()
let currentlyPlaying = $state<string | null>(null)
let toneLoaded = $state(false)

let masterVolume = $state(0)

export const getMixerState = () => {
  const setPlayers = (newPlayersState: Record<string, Tone.Player>) => {
    players = newPlayersState
  }

  const setChannelStates = states => {
    channelStates = states
  }

  const setChannelVolume = (channel: string, volume: number) => {
    if (channelStates[channel]) {
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
    if (players && players[key] && players[key].state !== "stopped") {
      players[key].stop()
      if (currentlyPlaying === key) {
        currentlyPlaying = null
      }
    }
  }

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

const registerMusic = (channel: Tone.ToneAudioNode): Record<string, Tone.Player> => {
  // Looping music ONLY
  // Main
  const main = new Tone.Player({
    url: soundLibrary.ratfun.main.src,
    loop: true,
    fadeIn: 3,
    fadeOut: 1,
    autostart: false
  })
    .connect(channel)
    .sync()

  // Admin
  const admin = new Tone.Player({
    url: soundLibrary.ratfun.admin.src,
    loop: true,
    autostart: false
  })
    .connect(channel)
    .sync()

  // Spawn
  const spawn = new Tone.Player({
    url: soundLibrary.tcm.podBg.src,
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

const getMusicForRoute = route => {
  if (route.route.id.includes("admin")) {
    return "admin"
  } else if (route.url.pathname.includes("result")) {
    return null // Stop all music for results
  } else if (route.route.id.includes("(game)")) {
    return "main"
  }

  return null
}

export async function switchAudio(
  to: Partial<import("@sveltejs/kit").Page>,
  from?: import("@sveltejs/kit").RouteDefinition
) {
  const mixer = getMixerState()

  if (!mixer.loaded || !mixer.players) return

  const targetMusic = getMusicForRoute(to)

  // Only change music if we're switching to something different
  if (mixer.currentlyPlaying !== targetMusic) {
    if (targetMusic === null) {
      mixer.stopAllMusic()
    } else {
      mixer.startMusic(targetMusic)
    }
  }
}

// Initialise the sound
export async function initSound(): Promise<void> {
  try {
    await Tone.start()

    const mixer = getMixerState()

    // Set up master volume
    Tone.getDestination().volume.value = mixer.masterVolume

    // Tone.getTransport().loop = true
    // Tone.getTransport().loopStart = 0
    // Tone.getTransport().loopEnd = 42.456 // Length of the main sample
    Tone.getTransport().start()
    // Tone.getTransport().on("loop", e => {})

    // Create and register Music channel
    musicChannel = new Tone.Channel().toDestination()
    mixer.registerChannel("music", musicChannel)

    // Create and register UI channel
    uiChannel = new Tone.Channel().toDestination()
    mixer.registerChannel("ui", uiChannel)

    // Register the music players and apply them to the music channel
    const musicPlayers = registerMusic(musicChannel)
    mixer.setPlayers(musicPlayers)

    // @todo: Try to play the correct music based on the current page
    if (mixer.players) {
      mixer.players?.main
    }

    // We will use the individual players to change play state
  } catch (error) {}
}

export const snapshotFactory = (): Snapshot => {
  const mixer = getMixerState()
  return {
    capture: () => {
      return {
        channelStates: mixer.channelStates
      }
    },
    restore: value => {
      mixer.setChannelStates(value.channelStates)
    }
  }
}
