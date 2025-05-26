import { createClient } from "@sanity/client"
import { SANITY_PRIVATE_CMS_ID } from "@config"

import dotenv from "dotenv"
dotenv.config()

const SANITY_PRIVATE_CMS_TOKEN = process.env.SANITY_PRIVATE_CMS_TOKEN

export const privateSanityClient = createClient({
  projectId: SANITY_PRIVATE_CMS_ID,
  dataset: "production",
  token: SANITY_PRIVATE_CMS_TOKEN,
  apiVersion: "2025-04-18",
  useCdn: false, // `false` if you want to ensure fresh data
})

export const loadDataPrivateSanity = async (query: string, params: any) => {
  try {
    const res = await privateSanityClient.fetch(query, params)
    if (res === null) {
      return Promise.reject(new Error("404"))
    }
    return res
  } catch (err) {
    return Promise.reject(new Error("404"))
  }
}