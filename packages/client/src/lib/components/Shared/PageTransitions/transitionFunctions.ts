import { fade, fly } from "svelte/transition"
import { elasticOut, linear } from "svelte/easing"

export const flip = (
  el: HTMLElement,
  params: {
    delay?: number
    duration?: number
    direction: "in" | "out"
    easing?: (t: number) => number
  } = {
    delay: 0,
    direction: "in",
    duration: 400
  }
) => {
  return {
    delay: params.delay || 0,
    duration: params.duration || 400,
    easing: params.easing || linear,
    css: (t: number, u: number) => {
      // When coming in, it goes from -90 to 0, when it's going out it comes from 0 to 90
      if (params.direction === "in") {
        return `
          transform: rotateY(${u * -90}deg);
        `
      } else {
        return `
          transform: rotateY(${u * 90}deg);
        `
      }
    }
  }
}

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

export const wipeDiagonal = (
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
      const feather = params.feather || 10
      const progress = params.direction === "in" ? t : u
      const wipePosition = progress * 100
      const featherStart = Math.max(0, wipePosition - feather)
      const featherEnd = Math.min(100, wipePosition + feather)

      return `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 999999;
        pointer-events: none;
        -webkit-mask-image: linear-gradient(45deg, #ffff ${featherStart}%, #ffff ${wipePosition}%, #0000 ${featherEnd}%, #0000 100%);
        mask-image: linear-gradient(45deg, #ffff ${featherStart}%, #ffff ${wipePosition}%, #0000 ${featherEnd}%, #0000 100%);
        mask-size: 100% 100%;
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

export const mask = (
  _: HTMLElement,
  params: {
    delay?: number
    duration?: number
    svgPath: string
    growthFactor?: number
    direction?: "in" | "out"
    easing?: (t: number) => number
  }
) => {
  return {
    delay: params.delay || 0,
    duration: params.duration || 400,
    easing: params.easing || linear,
    css: (t: number, u: number) => {
      const progress = params.direction === "out" ? u : t
      const growth = params.growthFactor || 1.2
      const scale = 1 + progress * (growth - 1)

      // Quick ramp up to full opacity, then stay at 1
      const opacity = progress < 0.3 ? progress / 0.3 : 1

      // In the final 10%, transition to no mask (full reveal)
      if (progress > 0.3) {
        const floodProgress = (progress - 0.3) / 0.3
        return `
          position: ${params.position};
          z-index: 1000000000;
          inset: 0;
          opacity: ${opacity};
          -webkit-mask-image:
            linear-gradient(to bottom,
              rgba(255,255,255,${1 - floodProgress}) 0%,
              rgba(255,255,255,1) ${(1 - floodProgress) * 100}%,
              rgba(255,255,255,1) 100%
            ),
            url("${params.svgPath}");
          mask-image:
            linear-gradient(to bottom,
              rgba(255,255,255,${1 - floodProgress}) 0%,
              rgba(255,255,255,1) ${(1 - floodProgress) * 100}%,
              rgba(255,255,255,1) 100%
            ),
            url("${params.svgPath}");
          -webkit-mask-composite: source-over;
          mask-composite: add;
          -webkit-mask-size: 100% 100%, ${scale * 200}% ${scale * 200}%;
          mask-size: 100% 100%, ${scale * 200}% ${scale * 200}%;
          mask-position: 50% 50%;
          mask-repeat: no-repeat;
        `
      }

      return `
        position: ${params.position};
        z-index: 1000000000;
        inset: 0;
        opacity: ${opacity};
        -webkit-mask-image: url("${params.svgPath}");
        mask-image: url("${params.svgPath}");
        -webkit-mask-size: ${scale * 200}% ${scale * 200}%;
        mask-size: ${scale * 200}% ${scale * 200}%;
        mask-position: 50% 50%;
        mask-repeat: no-repeat;
      `
    }
  }
}

export const transitionFunctions = {
  none: () => ({ delay: 0, duration: 0, css: () => "" }),
  fade,
  fly,
  flip,
  mask,
  wipe: wipe,
  wipeDiagonal,
  leftToRight,
  strobeWipe,
  slideLeft,
  slideRight,
  slideFromLeft,
  slideFromRight
}

export type TransitionFunction = keyof typeof transitionFunctions
