export type TextSegment = { type: string; text: string }

// Handles nested tags one level deep
function processNestedContent(
  outerTag: string,
  content: string,
  knownTags: string[]
): TextSegment[] {
  const innerTagRegex = /\[([A-Z]+)\](.*?)\[\/\1\]/g
  const segments: TextSegment[] = []
  let currentIndex = 0
  let match: RegExpExecArray | null

  while ((match = innerTagRegex.exec(content)) !== null) {
    const innerTagName = match[1]
    const innerContent = match[2]

    // Add any text before this inner tag as part of outer tag
    if (match.index > currentIndex) {
      segments.push({
        type: outerTag,
        text: content.substring(currentIndex, match.index)
      })
    }

    // BALANCE inside QUOTE takes precedence
    if (innerTagName === "BALANCE" && outerTag === "QUOTE" && knownTags.includes("BALANCE")) {
      segments.push({ type: "BALANCE", text: innerContent })
    } else {
      // For any other nested tag, strip markup and use outer tag type
      segments.push({ type: outerTag, text: innerContent })
    }

    currentIndex = match.index + match[0].length
  }

  // Add any remaining content after the last inner tag
  if (currentIndex < content.length) {
    segments.push({ type: outerTag, text: content.substring(currentIndex) })
  }

  // If no inner tags were found, return the content as-is with outer tag
  if (segments.length === 0) {
    segments.push({ type: outerTag, text: content })
  }

  return segments
}

export function parseLogText(text: string, knownTags: string[]): TextSegment[] {
  const segments: TextSegment[] = []
  let currentIndex = 0

  const regex = /\[([A-Z]+)\](.*?)\[\/\1\]/gs
  let match: RegExpExecArray | null

  while ((match = regex.exec(text)) !== null) {
    if (match.index > currentIndex) {
      segments.push({
        type: "plain",
        text: text.substring(currentIndex, match.index)
      })
    }

    const tagName = match[1]
    const content = match[2]

    if (knownTags.includes(tagName)) {
      // Process content for potential nested tags
      const processedSegments = processNestedContent(tagName, content, knownTags)
      segments.push(...processedSegments)
    } else {
      segments.push({ type: "plain", text: match[0] })
    }

    currentIndex = match.index + match[0].length
  }

  if (currentIndex < text.length) {
    segments.push({ type: "plain", text: text.substring(currentIndex) })
  }

  return segments
}
