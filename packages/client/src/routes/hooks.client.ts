import type { HandleClientError } from "@sveltejs/kit"
import { errorHandler } from "$lib/modules/error-handling"

export const handleError: HandleClientError = async ({ message }) => {
  if (import.meta.env.DEV) {
    console.error(message)
  }

  errorHandler(undefined, message)

  return {
    message: "Whoops!"
  }
}
