/*
 *  Functions to fetch data from Sanity
 *
 */

import { createClient } from "@sanity/client"
import imageUrlBuilder from "@sanity/image-url"
import { PUBLIC_SANITY_CMS_ID } from "$env/static/public"
import { CMSError } from "$lib/modules/error-handling/errors"

export const client = createClient({
  projectId: PUBLIC_SANITY_CMS_ID,
  dataset: "production",
  apiVersion: "2025-06-01",
  useCdn: false
})

const builder = imageUrlBuilder(client)

export const urlFor = (source: any) => builder.image(source)

export const loadData = async (query: string, params: any) => {
  try {
    const res = await client.fetch(query, params)
    if (res === null) {
      return Promise.reject(new CMSError("Content not found", null))
    }
    return res
  } catch (err) {
    return Promise.reject(new CMSError("Failed to load content from CMS", err))
  }
}
