import { fade, fly } from "svelte/transition"
import { elasticOut, linear } from "svelte/easing"

export const wipe = (
  _: HTMLElement,
  params: {
    delay?: number
    duration?: number
    feather?: number
    direction: "in" | "out"
    easing?: (t: number) => number
  } = {
    direction: "out"
  }
) => {
  return {
    delay: params.delay || 0,
    duration: params.duration || 400,
    easing: params.easing || linear,
    css: (t: number, u: number) => {
      const progress = u
      const halfWidth = progress * 50 // Expands from 0% to 50% on each side
      const centerLeft = 50 - halfWidth
      const centerRight = 50 + halfWidth
      const angle = 90
      const fromColor = "#ffff"
      const toColor = "#0000"

      return `
        position: fixed;
        z-index: 1000000000;
        inset: 0;
        -webkit-mask-image: linear-gradient(${angle}deg, ${fromColor} ${centerLeft}%, ${toColor} ${centerLeft}%, ${toColor} ${centerRight}%, ${fromColor} ${centerRight}%);
        mask-image: linear-gradient(${angle}deg, ${fromColor} ${centerLeft}%, ${toColor} ${centerLeft}%, ${toColor} ${centerRight}%, ${fromColor} ${centerRight}%);
        -webkit-mask-size: 100vw 100vh;
        mask-size: 100vw 100vh;
        mask-position: 50% 50%;
        mask-repeat: no-repeat;
      `
    }
  }
}

export const leftToRight = (
  node: HTMLElement,
  params: {
    delay?: number
    duration?: number
    feather?: number
    easing?: (t: number) => number
  }
) => {
  const css = (t: number, _: number) => `
  -webkit-mask-image: linear-gradient(to left,  #ffff ${t * 100}%, #0000 ${t * 100 + (params?.feather || 0)}%);
  mask-image: linear-gradient(to left,  #ffff ${t * 100}%, #0000 ${t * 100 + (params?.feather || 0)}%);
  -webkit-mask-size: 100vw 100vh;
  mask-size: 100vw 100vh;
  mask-position: 50% 50%;
  mask-repeat: no-repeat;
`

  return {
    delay: params.delay || 0,
    duration: params.duration || 400,
    easing: params.easing || elasticOut,
    css
  }
}

export function whoosh(
  node: HTMLElement,
  params: { delay?: number; duration?: number; easing?: (t: number) => number }
) {
  const existingTransform = getComputedStyle(node).transform.replace("none", "")

  return {
    delay: params.delay || 0,
    duration: params.duration || 400,
    easing: params.easing || elasticOut,
    css: (t: number, _: number) => `transform: ${existingTransform} scale(${t})`
  }
}

export const strobeWipe = (
  _: HTMLElement,
  params: {
    delay?: number
    duration?: number
    feather?: number
    cycles?: number
    easing?: (t: number) => number
  } = {}
) => {
  return {
    delay: params.delay || 0,
    duration: params.duration || 800,
    easing: params.easing || linear,
    css: (t: number, u: number) => {
      const cycles = params.cycles || 10
      const feather = params.feather || 100
      const progress = u

      // Create cycling effect - repeat the sweep multiple times
      const cycleProgress = (progress * cycles) % 1

      // Scan lines move from bottom (100%) to top (0%)
      const scanPosition = 100 - cycleProgress * 100
      const scanStart = Math.max(0, scanPosition - feather)
      const scanEnd = Math.min(100, scanPosition + feather)

      return `
        position: absolute;
        z-index: 1000000000;
        inset: 0;
        -webkit-mask-image: linear-gradient(0deg, #0000 ${scanStart}%, #ffff ${scanPosition}%, #0000 ${scanEnd}%);
        mask-image: linear-gradient(0deg, #0000 ${scanStart}%, #ffff ${scanPosition}%, #0000 ${scanEnd}%);
        -webkit-mask-size: 100% 100%;
        mask-size: 100% 100%;
        mask-position: 50% 50%;
        mask-repeat: no-repeat;
      `
    }
  }
}

export const slideLeft = (
  node: HTMLElement,
  params: {
    delay?: number
    duration?: number
    easing?: (t: number) => number
  } = {}
) => {
  const existingTransform = getComputedStyle(node).transform.replace("none", "")

  return {
    delay: params.delay || 0,
    duration: params.duration || 400,
    easing: params.easing || linear,
    css: (t: number, u: number) => `
      position: absolute;
      display: block !important;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      transform: ${existingTransform} translateX(${u * -100}%);
    `
  }
}

export const slideRight = (
  node: HTMLElement,
  params: {
    delay?: number
    duration?: number
    easing?: (t: number) => number
  } = {}
) => {
  const existingTransform = getComputedStyle(node).transform.replace("none", "")

  return {
    delay: params.delay || 0,
    duration: params.duration || 400,
    easing: params.easing || linear,
    css: (t: number, u: number) => `
      position: absolute;
      display: block !important;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      transform: ${existingTransform} translateX(${u * 100}%);
    `
  }
}

export const slideFromLeft = (
  node: HTMLElement,
  params: {
    delay?: number
    duration?: number
    easing?: (t: number) => number
  } = {}
) => {
  const existingTransform = getComputedStyle(node).transform.replace("none", "")

  return {
    delay: params.delay || 0,
    duration: params.duration || 400,
    easing: params.easing || linear,
    css: (t: number, u: number) => `
      position: absolute;
      display: block !important;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      transform: ${existingTransform} translateX(${(1 - t) * -100}%);
    `
  }
}

export const slideFromRight = (
  node: HTMLElement,
  params: {
    delay?: number
    duration?: number
    easing?: (t: number) => number
  } = {}
) => {
  const existingTransform = getComputedStyle(node).transform.replace("none", "")

  return {
    delay: params.delay || 0,
    duration: params.duration || 400,
    easing: params.easing || linear,
    css: (t: number, u: number) => `
      position: absolute;
      display: block !important;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      transform: ${existingTransform} translateX(${(1 - t) * 100}%);
    `
  }
}

export const transitionFunctions = {
  none: () => ({ delay: 0, duration: 0, css: () => "" }),
  fade,
  fly,
  wipe: wipe,
  leftToRight,
  strobeWipe,
  slideLeft,
  slideRight,
  slideFromLeft,
  slideFromRight
}

export type TransitionFunction = keyof typeof transitionFunctions
