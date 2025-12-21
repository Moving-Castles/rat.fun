/**
 * Shared configuration for log text parsing and rendering
 */

/** Known tags that parseLogText will recognize */
export const KNOWN_TAGS = ["ITEM", "QUOTE", "SYSTEM", "BALANCE"] as const

export type KnownTag = (typeof KNOWN_TAGS)[number]

/** Mapping from tag names to CSS class names */
export const TAG_CLASS_MAP: Record<KnownTag, string> = {
  ITEM: "item-ref",
  QUOTE: "quote",
  SYSTEM: "system-message",
  BALANCE: "balance-message"
}
