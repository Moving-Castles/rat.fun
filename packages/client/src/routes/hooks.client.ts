import type { HandleClientError } from "@sveltejs/kit"

export const handleError: HandleClientError = async ({ message }) => {
  if (import.meta.env.DEV) {
    console.error(message)
  }

  return {
    message: "Whoops!"
  }
}
