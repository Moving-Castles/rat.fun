import type { SoundAssets } from "../types.js"

export const ratfunMascot: SoundAssets = {
  mascot1: {
    src: "/sounds/ratfun/mascot/1.mp3",
    author: "leo",
    volume: 1
  },
  mascot2: {
    src: "/sounds/ratfun/mascot/2.mp3",
    author: "leo",
    volume: 1
  },
  mascot3: {
    src: "/sounds/ratfun/mascot/3.mp3",
    author: "leo",
    volume: 1
  },
  mascot4: {
    src: "/sounds/ratfun/mascot/4.mp3",
    author: "leo",
    volume: 1
  },
  mascot5: {
    src: "/sounds/ratfun/mascot/5.mp3",
    author: "leo",
    volume: 1
  },
  mascot6: {
    src: "/sounds/ratfun/mascot/6.mp3",
    author: "leo",
    volume: 1
  },
  mascot7: {
    src: "/sounds/ratfun/mascot/7.mp3",
    author: "leo",
    volume: 1
  },
  mascot8: {
    src: "/sounds/ratfun/mascot/8.mp3",
    author: "leo",
    volume: 1
  },
  mascot9: {
    src: "/sounds/ratfun/mascot/9.mp3",
    author: "leo",
    volume: 1
  },
  mascot10: {
    src: "/sounds/ratfun/mascot/10.mp3",
    author: "leo",
    volume: 1
  },
  mascot11: {
    src: "/sounds/ratfun/mascot/11.mp3",
    author: "leo",
    volume: 1
  },
  mascot12: {
    src: "/sounds/ratfun/mascot/12.mp3",
    author: "leo",
    volume: 1
  },
  mascot13: {
    src: "/sounds/ratfun/mascot/13.mp3",
    author: "leo",
    volume: 1
  },
  mascot14: {
    src: "/sounds/ratfun/mascot/14.mp3",
    author: "leo",
    volume: 1
  },
  mascot15: {
    src: "/sounds/ratfun/mascot/15.mp3",
    author: "leo",
    volume: 1
  },
  mascot16: {
    src: "/sounds/ratfun/mascot/16.mp3",
    author: "leo",
    volume: 1
  },
  mascot17: {
    src: "/sounds/ratfun/mascot/17.mp3",
    author: "leo",
    volume: 1
  },
  mascot18: {
    src: "/sounds/ratfun/mascot/18.mp3",
    author: "leo",
    volume: 1
  },
  mascot19: {
    src: "/sounds/ratfun/mascot/19.mp3",
    author: "leo",
    volume: 1
  },
  mascot20: {
    src: "/sounds/ratfun/mascot/20.mp3",
    author: "leo",
    volume: 1
  },
  mascot21: {
    src: "/sounds/ratfun/mascot/21.mp3",
    author: "leo",
    volume: 1
  },
  mascot22: {
    src: "/sounds/ratfun/mascot/22.mp3",
    author: "leo",
    volume: 1
  },
  mascot23: {
    src: "/sounds/ratfun/mascot/23.mp3",
    author: "leo",
    volume: 1
  },
  mascot24: {
    src: "/sounds/ratfun/mascot/24.mp3",
    author: "leo",
    volume: 1
  },
  mascot25: {
    src: "/sounds/ratfun/mascot/25.mp3",
    author: "leo",
    volume: 1
  },
  mascot26: {
    src: "/sounds/ratfun/mascot/26.mp3",
    author: "leo",
    volume: 1
  },
  mascot27: {
    src: "/sounds/ratfun/mascot/27.mp3",
    author: "leo",
    volume: 1
  },
  mascot28: {
    src: "/sounds/ratfun/mascot/28.mp3",
    author: "leo",
    volume: 1
  },
  mascot29: {
    src: "/sounds/ratfun/mascot/29.mp3",
    author: "leo",
    volume: 1
  },
  mascot30: {
    src: "/sounds/ratfun/mascot/30.mp3",
    author: "leo",
    volume: 1
  },
  mascot31: {
    src: "/sounds/ratfun/mascot/31.mp3",
    author: "leo",
    volume: 1
  },
  mascot32: {
    src: "/sounds/ratfun/mascot/32.mp3",
    author: "leo",
    volume: 1
  }
}

// Array of mascot sound IDs for random selection
export const mascotSoundIds = [
  "mascot1",
  "mascot2",
  "mascot3",
  "mascot4",
  "mascot5",
  "mascot6",
  "mascot7",
  "mascot8",
  "mascot9",
  "mascot10",
  "mascot11",
  "mascot12",
  "mascot13",
  "mascot14",
  "mascot15",
  "mascot16",
  "mascot17",
  "mascot18",
  "mascot19",
  "mascot20",
  "mascot21",
  "mascot22",
  "mascot23",
  "mascot24",
  "mascot25",
  "mascot26",
  "mascot27",
  "mascot28",
  "mascot29",
  "mascot30",
  "mascot31",
  "mascot32"
] as const

export type MascotSoundId = (typeof mascotSoundIds)[number]

export function getRandomMascotSoundId(): MascotSoundId {
  return mascotSoundIds[Math.floor(Math.random() * mascotSoundIds.length)]
}
