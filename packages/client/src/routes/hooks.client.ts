import type { HandleClientError } from "@sveltejs/kit"

export const handleError: HandleClientError = async ({ message }) => {
  console.log("handling error")
  if (import.meta.env.DEV) {
    console.error(message)
  }

  return {
    message: "Whoops!"
  }
}
