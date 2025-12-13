/**
 * Sanitize chat message content for safe display.
 * Performs basic XSS prevention and whitespace normalization.
 */
export function sanitizeContent(content: string): string {
  // Trim whitespace
  let sanitized = content.trim()

  // Remove excessive whitespace (multiple spaces/newlines become single space)
  sanitized = sanitized.replace(/\s+/g, " ")

  // Basic XSS prevention (client should also sanitize on render)
  sanitized = sanitized.replace(/</g, "&lt;").replace(/>/g, "&gt;")

  return sanitized
}

/**
 * Validate chat message content
 * @returns Error message if invalid, null if valid
 */
export function validateContent(content: unknown): string | null {
  if (typeof content !== "string") {
    return "Message content must be a string"
  }

  const trimmed = content.trim()

  if (trimmed.length === 0) {
    return "Message cannot be empty"
  }

  if (trimmed.length > 280) {
    return "Message exceeds maximum length of 280 characters"
  }

  return null
}
