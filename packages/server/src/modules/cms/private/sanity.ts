import { createClient } from "@sanity/client"

const PRIVATE_SANITY_CMS_ID = process.env.PRIVATE_SANITY_CMS_ID
const PRIVATE_SANITY_CMS_TOKEN = process.env.PRIVATE_SANITY_CMS_TOKEN

export const privateSanityClient = createClient({
  projectId: PRIVATE_SANITY_CMS_ID,
  dataset: "production",
  token: PRIVATE_SANITY_CMS_TOKEN,
  apiVersion: "2025-04-18",
  useCdn: false // `false` if you want to ensure fresh data
})

export const loadDataPrivateSanity = async (query: string, params: any) => {
  try {
    const res = await privateSanityClient.fetch(query, params)
    if (res === null) {
      return Promise.reject(new Error("404"))
    }
    return res
  } catch {
    return Promise.reject(new Error("404"))
  }
}
