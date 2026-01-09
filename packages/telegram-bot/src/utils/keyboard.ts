import { InlineKeyboard } from "grammy"

/**
 * Build a simple yes/no confirmation keyboard
 */
export function buildConfirmKeyboard(yesCallback: string, noCallback: string): InlineKeyboard {
  return new InlineKeyboard()
    .text("Yes", yesCallback)
    .text("No", noCallback)
}

/**
 * Build a pagination keyboard
 */
export function buildPaginationKeyboard(
  currentPage: number,
  totalPages: number,
  callbackPrefix: string
): InlineKeyboard {
  const keyboard = new InlineKeyboard()

  if (currentPage > 1) {
    keyboard.text("◀️ Prev", `${callbackPrefix}_${currentPage - 1}`)
  }

  keyboard.text(`${currentPage}/${totalPages}`, "noop")

  if (currentPage < totalPages) {
    keyboard.text("Next ▶️", `${callbackPrefix}_${currentPage + 1}`)
  }

  return keyboard
}

/**
 * Build a back button keyboard
 */
export function buildBackKeyboard(backCallback: string, backText: string = "Back"): InlineKeyboard {
  return new InlineKeyboard().text(`◀️ ${backText}`, backCallback)
}
