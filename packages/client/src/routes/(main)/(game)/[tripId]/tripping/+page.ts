import { redirect } from "@sveltejs/kit"
import { get } from "svelte/store"
import { player } from "$lib/modules/state/stores"

export const prerender = false

export const load = ({ params, url }: { params: { tripId: string }; url: URL }) => {
  const ratId = url.searchParams.get("rat")
  // Flags to prevent double entry
  const enterFlag = url.searchParams.get("enter") === "true"
  const timestamp = parseInt(url.searchParams.get("t") || "0")

  // Proceed if:
  // 1. The enter flag is true
  // 2. The rat ID matches the current rat
  // 3. The timestamp is within the last 10 seconds
  // Otherwise, redirect to the home page
  if (!(enterFlag && ratId === get(player).currentRat && Date.now() - timestamp < 10000)) {
    throw redirect(302, "/")
  }

  return { tripId: params.tripId }
}
