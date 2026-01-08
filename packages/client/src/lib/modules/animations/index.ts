/**
 * ========================================
 *  utils/animations.ts
 * ========================================
 * Animation utility functions for GSAP timelines.
 */

import { playSound } from "$lib/modules/sound"
import type { EasingFunction } from "svelte/transition"

/**
 * Configuration for the count animation
 */
export interface CountAnimationConfig {
  /** The GSAP timeline to add animations to */
  timeline: gsap.core.Timeline
  /** The HTML element to update with count values */
  valueElement: HTMLElement
  /** The target value to count to (can be negative) */
  value: number
  /** Delay between each count step in seconds */
  stepDelay?: number
  /** Size of each section before speeding up (default: 50) */
  sectionSize?: number
  /** Multiplier for delay at section boundaries (default: 5) */
  sectionDelayMultiplier?: number
  /** Multiplier for speed in each new section (default: 0.65 = 35% faster) */
  sectionSpeedMultiplier?: number
  /** Pitch offset per section - base pitch shifts up/down each section (default: 0.15) */
  sectionPitchOffset?: number
  /** Function to calculate pitch for the counter tick sound based on current count */
  calculatePitch?: (
    count: number,
    isNegative: boolean,
    sectionIndex: number,
    positionInSection: number
  ) => number
  /** Whether to play counter tick sounds */
  playTickSound?: boolean
}

/**
 * Adds a count up/down animation to a GSAP timeline
 *
 * This function creates a series of timeline callbacks that update
 * a text element with incrementing/decrementing values, playing
 * tick sounds with varying pitch at each step.
 *
 * The animation divides the count into sections (default 50), with each
 * section counting progressively faster and pausing at boundaries.
 * The pitch shifts higher (up) or lower (down) with each section.
 * For example, counting to 135:
 * - 1-49: normal speed, base pitch 1.0
 * - 50: pause (5x delay)
 * - 51-99: 35% faster, base pitch 1.15
 * - 100: pause (5x delay)
 * - 101-135: 55% faster, base pitch 1.3
 *
 * @param config - Configuration object for the animation
 *
 * @example
 * ```ts
 * const timeline = gsap.timeline()
 * addCountAnimation({
 *   timeline,
 *   valueElement: myElement,
 *   value: 135,
 *   stepDelay: 0.03,
 *   sectionSize: 50,
 *   sectionSpeedMultiplier: 0.65,  // 35% faster each section
 *   sectionDelayMultiplier: 5,     // 5x pause at boundaries
 *   sectionPitchOffset: 0.15       // Shift pitch by 0.15 each section
 * })
 * ```
 */
export function addCountAnimation(config: CountAnimationConfig): void {
  const {
    timeline,
    valueElement,
    value,
    stepDelay = 0.03,
    sectionSize = 50,
    sectionDelayMultiplier = 5,
    sectionSpeedMultiplier = 0.65,
    sectionPitchOffset = 0.15,
    calculatePitch,
    playTickSound = true
  } = config

  const isNegative = value < 0
  const absValue = Math.abs(value)

  // Use provided pitch calculation or create default with sectionPitchOffset
  const pitchCalc =
    calculatePitch ||
    ((count, isNeg, secIdx, posInSec) =>
      defaultPitchCalculation(count, isNeg, secIdx, posInSec, sectionPitchOffset))

  // Count update helper
  const updateCountValue = (count: number, sectionIndex: number, positionInSection: number) => {
    const displayValue = isNegative ? -count : count
    valueElement.textContent = String(displayValue)

    if (playTickSound) {
      const pitch = pitchCalc(count, isNegative, sectionIndex, positionInSection)
      playSound({ category: "ratfunUI", id: "counterTick", pitch })
    }
  }

  // Build timeline with scheduled callbacks for each count
  for (let i = 1; i <= absValue; i++) {
    // Determine which section we're in (0-based: section 0 = counts 1-50, section 1 = counts 51-100, etc.)
    const sectionIndex = Math.floor((i - 1) / sectionSize)

    // Calculate position within current section (1-based: 1-50, 1-50, etc.)
    const positionInSection = ((i - 1) % sectionSize) + 1

    // Calculate step delay for this section (each section is progressively faster)
    const currentStepDelay = stepDelay * Math.pow(sectionSpeedMultiplier, sectionIndex)

    let position: string | number
    if (i === 1) {
      // First count overlaps slightly with previous animation
      position = ">-0.05"
    } else if (i % sectionSize === 0 && i !== absValue) {
      // Section boundary number (e.g., 50, 100, 150...) - add extra pause
      position = `+=${currentStepDelay * sectionDelayMultiplier}`
    } else {
      // Normal count within a section
      position = `+=${currentStepDelay}`
    }

    timeline.call(updateCountValue, [i, sectionIndex, positionInSection], position)
  }
}

/**
 * Default pitch calculation for counter tick sounds
 * Uses position within section (resets each section) to keep pitch in audible range
 * Shifts the base pitch higher (counting up) or lower (counting down) for each section
 * Caps pitch between reasonable bounds to avoid distortion
 */
function defaultPitchCalculation(
  count: number,
  isNegative: boolean,
  sectionIndex: number,
  positionInSection: number,
  sectionPitchOffset: number
): number {
  // Calculate base pitch for this section
  // For counting up: pitch goes up with each section (1.0, 1.15, 1.3, ...)
  // For counting down: pitch goes down with each section (1.0, 0.85, 0.7, ...)
  const basePitch = 1 + (isNegative ? -1 : 1) * sectionIndex * sectionPitchOffset

  // Add variation within the section based on position (resets each section)
  const pitchVariation = positionInSection * 0.01

  // Combine base pitch with variation
  const finalPitch = basePitch + pitchVariation

  // Cap pitch between reasonable bounds
  return Math.max(0.01, Math.min(2, finalPitch))
}

/**
 * Configuration for the eased count animation
 */
export interface EasedCountAnimationConfig {
  /** The GSAP timeline to add animations to */
  timeline: gsap.core.Timeline
  /** The HTML element to update with count values */
  valueElement: HTMLElement
  /** The target value to count to (can be negative) */
  value: number
  /** Starting delay between counts in seconds (default: 0.05) */
  startDelay?: number
  /** Ending delay between counts in seconds (default: 0.01) */
  endDelay?: number
  /** Easing function to control acceleration (default: quadIn for acceleration) */
  easing?: EasingFunction
  /** Starting pitch for sounds (default: 0.8) */
  startPitch?: number
  /** Ending pitch for sounds (default: 1.5) */
  endPitch?: number
  /** Whether to play counter tick sounds */
  playTickSound?: boolean
  /** Maximum duration for the animation in seconds (default: 15) */
  maxDuration?: number
  /** Threshold value to trigger callback (e.g., 1000) */
  threshold?: number
  /** Callback when counter reaches threshold, receives remaining duration in seconds */
  onThresholdReached?: (remainingDuration: number) => void
}

/**
 * Adds a continuously accelerating/decelerating count animation to a GSAP timeline
 *
 * This version uses an easing function to smoothly transition from a start delay
 * to an end delay, creating a continuous acceleration or deceleration effect.
 * The pitch also transitions smoothly from start to end pitch.
 *
 * @param config - Configuration object for the animation
 *
 * @example
 * ```ts
 * import { quadIn } from 'svelte/easing'
 *
 * const timeline = gsap.timeline()
 * addEasedCountAnimation({
 *   timeline,
 *   valueElement: myElement,
 *   value: 100,
 *   startDelay: 0.05,  // Start slow
 *   endDelay: 0.005,   // End fast
 *   easing: quadIn     // Accelerate
 * })
 * ```
 */
export function addEasedCountAnimation(config: EasedCountAnimationConfig): void {
  const {
    timeline,
    valueElement,
    value,
    startDelay = 0.03,
    endDelay = 0.0005,
    // easing = (t: number) => t * t, // Default to quadIn
    easing = (t: number) => t, // Default to linear
    startPitch = 0.8,
    endPitch = 2.0,
    playTickSound = true,
    maxDuration = 15,
    threshold,
    onThresholdReached
  } = config

  const isNegative = value < 0
  const absValue = Math.abs(value)

  if (absValue === 0) return

  // Determine sampling strategy based on value size
  // - <500: No sampling, natural duration
  // - 500-10,000: No sampling, but scale to use full maxDuration for dramatic effect
  // - >10,000: Sample every 100 for performance
  const sampleInterval = absValue > 10000 ? 100 : 1
  const effectiveCount = Math.floor(absValue / sampleInterval)

  // Calculate estimated duration with current delays
  const averageDelay = (startDelay + endDelay) / 2
  const estimatedDuration = effectiveCount * averageDelay

  // Scale delays based on strategy
  let scaledStartDelay = startDelay
  let scaledEndDelay = endDelay

  if (absValue >= 500) {
    // For big wins (500+), always scale to use full maxDuration for impact
    const scaleFactor = maxDuration / estimatedDuration
    scaledStartDelay = startDelay * scaleFactor
    scaledEndDelay = endDelay * scaleFactor
  } else if (estimatedDuration > maxDuration) {
    // For smaller values, only scale if they would exceed maxDuration
    const scaleFactor = maxDuration / estimatedDuration
    scaledStartDelay = startDelay * scaleFactor
    scaledEndDelay = endDelay * scaleFactor
  }

  // For very large values, reduce sound frequency to avoid audio spam
  const soundInterval = absValue > 10000 ? 10 : 1

  // Track accumulated time for threshold callback
  let accumulatedTime = 0
  let thresholdTriggered = false

  // Count update helper
  const updateCountValue = (count: number, pitch: number, shouldPlaySound: boolean) => {
    const displayValue = isNegative ? -count : count
    valueElement.textContent = String(displayValue)

    if (playTickSound && shouldPlaySound) {
      playSound({ category: "ratfunUI", id: "counterTick", pitch })
    }
  }

  // Build timeline with eased delays and sampling
  for (let i = 1; i <= effectiveCount; i++) {
    const currentCount = i * sampleInterval

    // Calculate progress through the count (0 to 1)
    const progress = effectiveCount === 1 ? 1 : (i - 1) / (effectiveCount - 1)

    // Apply easing to progress
    const easedProgress = easing(progress)

    // Interpolate delay based on eased progress (using scaled delays)
    const currentDelay = scaledStartDelay + (scaledEndDelay - scaledStartDelay) * easedProgress

    // Interpolate pitch based on eased progress
    const currentPitch = startPitch + (endPitch - startPitch) * easedProgress

    // Determine if sound should play this step
    const shouldPlaySound = i % soundInterval === 0

    // Determine position
    const position = i === 1 ? ">-0.05" : `+=${currentDelay}`

    // Add to accumulated time
    if (i > 1) {
      accumulatedTime += currentDelay
    }

    // Check if we've reached the threshold
    if (threshold && onThresholdReached && !thresholdTriggered && currentCount >= threshold) {
      // Calculate remaining duration from threshold to end
      const remainingSteps = effectiveCount - i
      let remainingDuration = 0

      // Sum up remaining delays
      for (let j = i + 1; j <= effectiveCount; j++) {
        const futureProgress = effectiveCount === 1 ? 1 : (j - 1) / (effectiveCount - 1)
        const futureEasedProgress = easing(futureProgress)
        const futureDelay =
          scaledStartDelay + (scaledEndDelay - scaledStartDelay) * futureEasedProgress
        remainingDuration += futureDelay
      }

      // Trigger callback at this position in timeline
      timeline.call(() => onThresholdReached(remainingDuration), [], position)
      thresholdTriggered = true
    }

    timeline.call(updateCountValue, [currentCount, currentPitch, shouldPlaySound], position)
  }
}

/**
 * Triggers a screen shake effect on the document body
 *
 * Creates a dramatic shake animation using GSAP that moves the entire
 * page container in x/y directions with elastic easing.
 *
 * @param intensity - Shake intensity (0-1 scale, where 1 is max shake). Default: 1
 * @param duration - Duration of the shake in seconds. Default: 0.5
 *
 * @example
 * ```ts
 * // Trigger a strong shake for big wins
 * triggerScreenShake(1.0, 0.8)
 *
 * // Trigger a medium shake
 * triggerScreenShake(0.5, 0.5)
 * ```
 */
export function triggerScreenShake(intensity: number = 1, duration: number = 0.5): void {
  // Only shake if we're in a browser environment
  if (typeof window === "undefined" || typeof document === "undefined") return

  // Target the main game container instead of body
  // This avoids affecting fixed overlays (toasts, lightboxes, modals)
  const target = document.querySelector(".bg") as HTMLElement

  if (!target) {
    console.warn("Screen shake target (.bg) not found")
    return
  }

  // Import gsap dynamically to ensure it's available
  import("gsap").then(({ gsap }) => {
    // Calculate shake distance based on intensity
    const maxShake = 35 * intensity // Max pixels to shake (increased for more vigorous effect)

    // For long durations, repeat the shake pattern
    // Each shake cycle is ~0.6s with 8 keyframes
    const shakeCycleDuration = 0.1
    const shakeCount = 12
    const cycleCount = Math.ceil(duration / shakeCycleDuration)

    // Create a timeline for the shake
    const shakeTimeline = gsap.timeline()

    // Generate shake cycles
    for (let cycle = 0; cycle < cycleCount; cycle++) {
      // Fade in intensity from nothing to full over the duration
      const cycleProgress = cycle / Math.max(1, cycleCount - 1)
      // Use power curve for smoother ramp: slow start, faster growth, full intensity at end
      const intensityFactor = Math.pow(cycleProgress, 0.7)
      const cycleIntensity = intensityFactor * maxShake

      // Each cycle has multiple shake keyframes
      for (let i = 0; i < shakeCount; i++) {
        const keyframeProgress = i / shakeCount
        // Slight decay within each cycle for natural motion
        const currentIntensity = (1 - keyframeProgress * 0.3) * cycleIntensity

        const x = (Math.random() - 0.5) * 2 * currentIntensity
        const y = (Math.random() - 0.5) * 2 * currentIntensity

        shakeTimeline.to(target, {
          x,
          y,
          duration: shakeCycleDuration / shakeCount,
          ease: "power2.out"
        })
      }
    }

    // Reset to original position at the end
    shakeTimeline.to(target, {
      x: 0,
      y: 0,
      duration: shakeCycleDuration / shakeCount,
      ease: "power2.out"
    })
  })
}
