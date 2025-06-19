import type { LayoutLoad } from './$types';
import { ENVIRONMENT } from "$lib/mud/enums"

export const prerender = true
export const ssr = false

const getEnvironment = (url: URL) => {
  const hostname = url.hostname

  if (hostname.includes("rhodolite") || url.searchParams.has("rhodolite")) {
    return ENVIRONMENT.RHODOLITE
  }

  if (hostname.includes("pyrope") || url.searchParams.has("pyrope")) {
    return ENVIRONMENT.PYROPE
  }

  return ENVIRONMENT.DEVELOPMENT
}

export const load: LayoutLoad = async ({ url }) => {
  const environment = getEnvironment(url)

  return {
    environment: ENVIRONMENT[environment]
  }
}