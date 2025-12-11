/*
 *  Functions to fetch data from Sanity
 *
 */

import { createClient } from "@sanity/client"
import imageUrlBuilder from "@sanity/image-url"
import { PUBLIC_SANITY_CMS_ID } from "$env/static/public"
import { CMSError } from "@ratfun/common/error-handling"

export const client = createClient({
  projectId: PUBLIC_SANITY_CMS_ID,
  dataset: "production",
  apiVersion: "2025-06-01",
  // CDN is used for fetch() calls for better performance.
  // Listeners (.listen()) automatically bypass CDN and use the live API.
  // useCdn: true
  useCdn: false
})

const builder = imageUrlBuilder(client)

export type ImageUrlBuilder = ReturnType<typeof imageUrlBuilder>

export const urlFor = (source: any) => {
  if (!source) return ""
  return builder.image(source)
}

/**
 * Sanitizes Sanity CMS data to ensure it's serializable by removing
 * non-serializable properties like symbols and unknown types
 */
const sanitizeSanityData = (data: any): any => {
  if (data === null || data === undefined) {
    return data
  }

  if (Array.isArray(data)) {
    return data.map(sanitizeSanityData)
  }

  if (typeof data === "object") {
    const sanitized: any = {}

    for (const [key, value] of Object.entries(data)) {
      // Skip symbol properties (like internalGroqTypeReferenceTo)
      if (typeof key === "symbol") {
        continue
      }

      // Skip properties with symbol keys
      if (key.startsWith("[") && key.includes("Symbol")) {
        continue
      }

      // Handle media field that can contain unknown types
      if (key === "media" && value !== null && value !== undefined) {
        // Only include media if it's a basic serializable type
        if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
          sanitized[key] = value
        }
        // Skip complex media objects that might not be serializable
        continue
      }

      // Recursively sanitize nested objects
      sanitized[key] = sanitizeSanityData(value)
    }

    return sanitized
  }

  return data
}

export const loadData = async (query: string, params: any) => {
  try {
    const res = await client.fetch(query, params)
    if (res === null) {
      return false
    }
    // Sanitize the data to ensure it's serializable for SvelteKit
    return sanitizeSanityData(res)
  } catch (err) {
    return Promise.reject(new CMSError("Failed to load content from CMS", err))
  }
}
