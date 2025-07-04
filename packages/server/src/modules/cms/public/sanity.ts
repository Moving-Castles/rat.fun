import { createClient } from "@sanity/client"

import dotenv from "dotenv"
dotenv.config()

const PUBLIC_SANITY_CMS_ID = process.env.PUBLIC_SANITY_CMS_ID
const PUBLIC_SANITY_CMS_TOKEN = process.env.PUBLIC_SANITY_CMS_TOKEN

console.log("PUBLIC_SANITY_CMS_ID", PUBLIC_SANITY_CMS_ID)
console.log("PUBLIC_SANITY_CMS_TOKEN", PUBLIC_SANITY_CMS_TOKEN)

export const publicSanityClient = createClient({
  projectId: PUBLIC_SANITY_CMS_ID,
  dataset: "production",
  token: PUBLIC_SANITY_CMS_TOKEN,
  useCdn: false, // `false` if you want to ensure fresh data
  apiVersion: "2025-04-18"
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
