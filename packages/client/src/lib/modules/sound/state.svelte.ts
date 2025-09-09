import * as Tone from "tone"
import { soundLibrary } from "$lib/modules/sound/sound-library"

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

let masterVolume = $state(-10)
let channels: Record<string, Tone.Channel> = {}

export const getMixerState = () => {
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

  const updateAllChannelVolumes = () => {
    Object.keys(channelStates).forEach(updateChannelVolume)
  }

  const registerChannel = (name: string, channel: Tone.Channel) => {
    channels[name] = channel
    if (!channelStates[name]) {
      channelStates[name] = { volume: 0, muted: false, solo: false, pan: 0 }
    }
    updateChannelVolume(name)
  }

  return {
    // Channel controls
    setChannelVolume,
    setChannelMute,
    setChannelSolo,
    // Master control
    setMasterVolume,
    // System
    registerChannel,
    get channels() {
      return channelStates
    },
    get master() {
      return masterVolume
    }
  }
}

// Initialise the sound
export async function initSound(): Promise<void> {
  try {
    await Tone.start()
    const mixer = getMixerState()

    // Set up master volume
    Tone.getDestination().volume.value = mixer.master

    Tone.getTransport().loop = true
    Tone.getTransport().loopStart = 0
    Tone.getTransport().loopEnd = 42.456 // Length of the main sample
    Tone.getTransport().start()
    Tone.getTransport().on("loop", e => {
      console.log("just looped", e)
    })

    // Create and register Music channel
    const musicChannel = new Tone.Channel().toDestination()
    mixer.registerChannel("music", musicChannel)

    // Create and register UI channel
    const uiChannel = new Tone.Channel().toDestination()
    mixer.registerChannel("ui", uiChannel)

    // ** Register audio for the mixer
    const mainPlayer = new Tone.Player({
      url: soundLibrary.ratfun.main.src,
      loop: true,
      onload: () => {
        console.log("on load")
        mainPlayer.start(0)
        console.log("started")
        mainPlayer.volume.rampTo(0, "1m")
      }
    })
      .connect(musicChannel)
      .sync()

    const loopingUp = new Tone.Player({
      url: soundLibrary.ratfun.upwardspiral.src,
      loop: false,
      onend: () => {
        console.log("we ended")
      },
      onload: () => {
        loopingUp.start("2m")
      }
    })
      .connect(musicChannel)
      .sync()

    console.log("Audio context started during init")
  } catch (error) {
    console.log("Audio context requires user gesture, will start later")
  }
}
