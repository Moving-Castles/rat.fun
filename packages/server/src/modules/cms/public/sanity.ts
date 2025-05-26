import { createClient } from "@sanity/client"
import { SANITY_PUBLIC_CMS_ID } from "@config"

import dotenv from "dotenv"
dotenv.config()

const SANITY_PUBLIC_CMS_TOKEN = process.env.SANITY_PUBLIC_CMS_TOKEN

export const publicSanityClient = createClient({
  projectId: SANITY_PUBLIC_CMS_ID,
  dataset: "production",
  token: SANITY_PUBLIC_CMS_TOKEN,
  useCdn: false, // `false` if you want to ensure fresh data
  apiVersion: "2025-04-18",
})

export const loadDataPublicSanity = async (query: string, params: any) => {
  try {
    const res = await publicSanityClient.fetch(query, params)
    if (res === null) {
      return Promise.reject(new Error("404"))
    }
    return res
  } catch (err) {
    return Promise.reject(new Error("404"))
  }
}

export const urlFor = () => {}
