import type { TerminalOutputUnit } from "./types.js"
import { playSound } from "$lib/modules/sound"

const DEFAULT_TYPE_SPEED = 10
const DEFAULT_DELAY_AFTER = 500
const DEFAULT_LOADER_DURATION = 3000

export function terminalTyper(targetElement: HTMLElement, units: TerminalOutputUnit[]) {
  let isStopped = false

  const controller = {
    stop: () => {
      isStopped = true
    },
    promise: (async () => {
      for (const unit of units) {
        if (isStopped) break
        await typeUnit(targetElement, unit, () => isStopped)
      }
    })()
  }

  return controller
}

async function typeUnit(
  targetElement: HTMLElement,
  unit: TerminalOutputUnit,
  isStopped: () => boolean
) {
  const typeSpeed = unit.typeSpeed ?? DEFAULT_TYPE_SPEED
  const delayAfter = unit.delayAfter ?? DEFAULT_DELAY_AFTER
  const sound = unit.sound ?? { category: "ratfunUI", id: "type" }
  const onType = unit.onType
  const typeMode = unit.typeMode ?? "char"

  if (unit.type === "text") {
    await typeText(
      targetElement,
      unit.content,
      typeSpeed,
      unit.color,
      unit.backgroundColor,
      unit.duration,
      isStopped,
      sound,
      typeMode,
      onType
    )
    if (!isStopped()) await sleep(delayAfter)
  } else if (unit.type === "loader") {
    await typeLoader(
      targetElement,
      unit.content,
      unit.duration ?? DEFAULT_LOADER_DURATION,
      typeSpeed,
      unit.color,
      unit.backgroundColor,
      unit.loaderCharacters ?? "",
      isStopped,
      sound,
      onType
    )
    if (!isStopped()) await sleep(delayAfter)
  }
}

async function typeText(
  targetElement: HTMLElement,
  content: string,
  typeSpeed: number,
  color: string,
  backgroundColor: string,
  duration: number | undefined,
  isStopped: () => boolean,
  sound: { category: string; id: string },
  typeMode: "char" | "word",
  onType?: (text: string, index: number) => void
) {
  // Start new line
  addLine(targetElement, "text")

  // If duration is 0, output everything at once
  if (duration === 0) {
    addTextToLine(targetElement, content, color, backgroundColor)
    if (onType) {
      onType("", 0)
    } else {
      playSound(sound)
    }
    return
  }

  if (typeMode === "word") {
    // Split by spaces but keep the spaces attached to words
    const words = content.split(/(\s+)/)
    let index = 0
    for (const word of words) {
      if (isStopped()) break
      if (word.length === 0) continue
      addTextToLine(targetElement, word, color, backgroundColor)
      // Only trigger sound/callback for non-whitespace words
      if (word.trim().length > 0) {
        if (onType) {
          onType(word, index)
        } else {
          playSound(sound)
        }
        index++
        await sleep(typeSpeed)
      }
    }
  } else {
    let index = 0
    for (const char of content) {
      if (isStopped()) break
      addChar(targetElement, char, color, backgroundColor)
      if (onType) {
        onType(char, index)
      } else {
        playSound(sound)
      }
      index++
      await sleep(typeSpeed)
    }
  }
}

async function typeLoader(
  targetElement: HTMLElement,
  content: string,
  duration: number,
  typeSpeed: number,
  color: string,
  backgroundColor: string,
  loaderCharacters: string,
  isStopped: () => boolean,
  sound: { category: string; id: string },
  onType?: (text: string, index: number) => void
) {
  // Start new line
  addLine(targetElement, "loader")

  // Output the content all at once
  addTextToLine(targetElement, content, color, backgroundColor)
  if (onType) {
    onType("", 0)
  } else {
    playSound(sound)
  }

  // If duration is 0, output everything at once
  if (duration === 0) {
    return
  }

  // Then repeat loaderCharacters for the duration
  const startTime = Date.now()
  let currentLoaderContent = ""
  let index = 0

  while (Date.now() - startTime < duration && !isStopped()) {
    // Clear current line content
    const currentLine = targetElement.lastElementChild as HTMLElement
    if (currentLine) {
      currentLine.innerHTML = ""
    }

    // Re-add the content
    addTextToLine(targetElement, content, color, backgroundColor)

    // Add all accumulated loader characters
    addTextToLine(targetElement, currentLoaderContent, color, backgroundColor)

    // Add loader characters repeatedly with sound effects
    for (const char of loaderCharacters) {
      if (isStopped()) return
      currentLoaderContent += char
      addChar(targetElement, char, color, backgroundColor)
      if (onType) {
        onType(char, index)
      } else {
        playSound(sound)
      }
      index++
      await sleep(typeSpeed)

      // Check if we've exceeded duration after each character
      if (Date.now() - startTime >= duration) {
        break
      }
    }
  }
}

function addLine(targetElement: HTMLElement, type: "text" | "loader") {
  const line = document.createElement("div")
  line.className = `terminal-line terminal-line--${type}`
  if (type === "loader") {
    line.style.wordBreak = "break-all"
    line.style.overflowWrap = "anywhere"
    line.style.maxWidth = "100%"
    line.style.width = "100%"
  }
  targetElement.appendChild(line)
}

function addChar(targetElement: HTMLElement, char: string, color: string, backgroundColor: string) {
  const currentLine = targetElement.lastElementChild as HTMLElement
  if (currentLine) {
    const isLoaderLine = currentLine.classList.contains("terminal-line--loader")

    const span = document.createElement("span")
    span.textContent = char
    span.style.color = color
    span.style.backgroundColor = backgroundColor
    span.style.display = "inline"

    // Only apply aggressive word-break to loader lines
    if (isLoaderLine) {
      span.style.wordBreak = "break-all"
    }

    currentLine.appendChild(span)

    // Add zero-width space after each character for iOS Safari line breaking
    if (isLoaderLine) {
      const zwsp = document.createTextNode("\u200B")
      currentLine.appendChild(zwsp)
    }
  }
}

function addTextToLine(
  targetElement: HTMLElement,
  text: string,
  color: string,
  backgroundColor: string
) {
  const currentLine = targetElement.lastElementChild as HTMLElement
  if (currentLine) {
    const isLoaderLine = currentLine.classList.contains("terminal-line--loader")

    if (isLoaderLine && text.length > 0) {
      // For loader lines, add each character with a zero-width space for iOS Safari
      for (const char of text) {
        const span = document.createElement("span")
        span.textContent = char
        span.style.color = color
        span.style.backgroundColor = backgroundColor
        span.style.display = "inline"
        span.style.wordBreak = "break-all"
        currentLine.appendChild(span)

        const zwsp = document.createTextNode("\u200B")
        currentLine.appendChild(zwsp)
      }
    } else {
      // For text lines, add as a single span without aggressive word-break
      const span = document.createElement("span")
      span.textContent = text
      span.style.color = color
      span.style.backgroundColor = backgroundColor
      span.style.display = "inline"
      currentLine.appendChild(span)
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
