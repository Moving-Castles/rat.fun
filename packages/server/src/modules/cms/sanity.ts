import { createClient } from "@sanity/client"
import { SANITY_ID } from "@config"

import dotenv from "dotenv"
dotenv.config()

const SANITY_TOKEN = process.env.SANITY_TOKEN

export const client = createClient({
  projectId: SANITY_ID,
  dataset: "production",
  token: SANITY_TOKEN,
  useCdn: false, // `false` if you want to ensure fresh data
  apiVersion: "2025-04-18",
})

export const loadData = async (query: string, params: any) => {
  try {
    const res = await client.fetch(query, params)
    if (res === null) {
      return Promise.reject(new Error("404"))
    }
    return res
  } catch (err) {
    return Promise.reject(new Error("404"))
  }
}

export const urlFor = () => {}
