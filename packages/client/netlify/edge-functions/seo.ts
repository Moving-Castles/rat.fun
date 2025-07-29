import { Config, Context } from "@netlify/edge-functions"
import { HTMLRewriter } from "https://ghuc.cc/worker-tools/html-rewriter/index.ts"

// Sanity client setup
const SANITY_PROJECT_ID = Deno.env.get("PUBLIC_SANITY_CMS_ID")
const SANITY_DATASET = "production"
const SANITY_API_VERSION = "2025-06-01"

// Cache for room data (in-memory cache for the edge function)
const roomCache = new Map<string, { data: any; timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

// GROQ query to fetch room data - matches your Room type
const ROOM_QUERY = `*[_type == "room" && slug.current == $slug][0]{
  prompt,
  ownerName,
  "slug": slug.current,
  image {
    asset-> {
      _id,
      url
    },
    alt
  }
}`

interface RoomData {
  prompt?: string
  ownerName?: string
  slug?: string
  image?: {
    asset?: {
      _id: string
      url: string
    }
    alt?: string
  }
}

async function fetchRoomData(slug: string): Promise<RoomData | null> {
  console.log("🔍 Checking cache for slug:", slug)

  // Check cache first
  const cached = roomCache.get(slug)
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log("💾 Cache hit! Using cached data")
    return cached.data
  }

  console.log("🌐 Cache miss, fetching from Sanity API")

  try {
    const sanityUrl = `https://${SANITY_PROJECT_ID}.api.sanity.io/v${SANITY_API_VERSION}/data/query/${SANITY_DATASET}`
    const queryParams = new URLSearchParams({
      query: ROOM_QUERY,
      $slug: slug
    })

    const fullUrl = `${sanityUrl}?${queryParams}`
    console.log("📡 Sanity request URL:", fullUrl)

    const response = await fetch(fullUrl, {
      headers: {
        Accept: "application/json"
      }
    })

    console.log("📊 Sanity response status:", response.status)
    console.log("📊 Sanity response headers:", Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      console.error(`❌ Failed to fetch room data: ${response.status} ${response.statusText}`)
      const errorText = await response.text()
      console.error("📄 Error response body:", errorText)
      return null
    }

    const data = await response.json()
    console.log("📊 Raw Sanity response:", JSON.stringify(data, null, 2))

    const roomData = data.result

    // Cache the result
    if (roomData) {
      console.log("💾 Caching room data for slug:", slug)
      roomCache.set(slug, { data: roomData, timestamp: Date.now() })
    } else {
      console.log("⚠️ No room data in result")
    }

    return roomData
  } catch (error) {
    console.error("💥 Error fetching room data:", error)
    console.error("📊 Error details:", error.message)
    return null
  }
}

function generateSEOMetaTags(roomData: RoomData, url: string): string {
  const defaultTitle = "RAT.FUN"

  // Use SEO-specific data if available, otherwise fall back to main content
  const seoTitle = roomData.seo?.title || roomData.title || defaultTitle
  const seoDescription = roomData.seo?.description || roomData.description || ""
  const seoImageUrl = roomData.seo?.imageUrl || roomData.imageUrl || "/images/meta.png"
  const seoImageAlt = roomData.seo?.imageAlt || roomData.imageAlt || "rat.fun"

  const finalTitle = seoTitle !== defaultTitle ? `${seoTitle} | ${defaultTitle}` : seoTitle

  return `
    <title>${finalTitle}</title>
    <meta name="siteUrl" content="${url}" />
    <meta name="pageTitle" content="${finalTitle}" />
    <meta name="description" content="${seoDescription}" />
    <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
    
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${finalTitle}" />
    <meta name="twitter:description" content="${seoDescription}" />
    <meta name="twitter:image" content="${seoImageUrl}" />
    <meta name="twitter:creator" content="@movingcastles_" />
    
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="${finalTitle}" />
    <meta property="og:locale" content="en-us" />
    <meta property="og:url" content="${url}" />
    <meta property="og:title" content="${finalTitle}" />
    <meta property="og:description" content="${seoDescription}" />
    <meta property="og:image" content="${seoImageUrl}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="600" />
    <meta property="og:image:alt" content="${seoImageAlt}" />
    <meta property="og:image:type" content="image/png" />
  `
}

export default async function handler(request: Request, context: Context) {
  console.log("🚀 Edge function triggered")

  const url = new URL(request.url)
  console.log("📍 URL:", url.toString())

  // Extract room slug from URL path
  const pathMatch = url.pathname.match(/^\/room\/([^\/]+)\/?$/)
  if (!pathMatch) {
    console.log("❌ No room slug found in path:", url.pathname)
    return // Not a room page, let it pass through
  }

  const roomSlug = pathMatch[1]
  console.log("🏠 Room slug extracted:", roomSlug)

  // Only process for search engines and social media crawlers
  const userAgent = request.headers.get("user-agent") || ""
  const isCrawler =
    /bot|crawler|spider|crawling|facebookexternalhit|twitterbot|linkedinbot|whatsapp/i.test(
      userAgent
    )
  const isPreview = url.searchParams.get("_seo") === "preview"

  console.log("🤖 User Agent:", userAgent)
  console.log("🕷️ Is Crawler:", isCrawler)
  console.log("👀 Is Preview:", isPreview)

  // For development, you might want to always process
  if (!isCrawler && !isPreview) {
    console.log("⏭️ Skipping SEO processing - not a crawler or preview")
    return // Let SPA handle it normally for regular users
  }

  try {
    console.log("📊 Fetching room data from Sanity...")

    // Fetch room data from Sanity
    const roomData = await fetchRoomData(roomSlug)

    if (!roomData) {
      console.warn(`⚠️ Room data not found for slug: ${roomSlug}`)
      return // Let the request pass through if no room data found
    }

    console.log("✅ Room data found:", JSON.stringify(roomData, null, 2))

    // Get the original response
    console.log("📄 Getting original response...")
    const response = await context.next()

    const contentType = response.headers.get("content-type")
    console.log("📝 Content-Type:", contentType)

    if (!contentType?.includes("text/html")) {
      console.log("⏭️ Skipping - not HTML content")
      return response // Only process HTML responses
    }

    // Generate SEO meta tags
    console.log("🏷️ Generating SEO meta tags...")
    const seoMetaTags = generateSEOMetaTags(roomData, request.url)
    console.log("📋 Generated SEO tags preview:", seoMetaTags.substring(0, 200) + "...")

    console.log("🔄 Applying HTML transformations...")
    // Use HTMLRewriter to inject SEO metadata
    const rewriter = new HTMLRewriter()
      .on("head", {
        element: element => {
          console.log("🎯 Found <head> element, injecting SEO tags")
          // Remove existing title and meta tags that we're replacing
          element.onEndTag(endTag => {
            endTag.before(seoMetaTags, { html: true })
          })
        }
      })
      .on("title", {
        element: element => {
          console.log("🏷️ Removing existing <title> tag")
          // Remove existing title as we're adding our own
          element.remove()
        }
      })
      .on('meta[name="description"], meta[property^="og:"], meta[name^="twitter:"]', {
        element: element => {
          console.log(
            "🧹 Removing existing meta tag:",
            element.getAttribute("name") || element.getAttribute("property")
          )
          // Remove existing meta tags that we're replacing
          element.remove()
        }
      })

    const transformedResponse = rewriter.transform(response)
    console.log("✅ HTML transformation complete")
    return transformedResponse
  } catch (error) {
    console.error("💥 Error in SEO edge function:", error)
    console.error("📊 Error stack:", error.stack)
    return // Let the request pass through on error
  }
}

export const config: Config = {
  path: "/room/*"
}
