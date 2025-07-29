import type { Context } from "@netlify/edge-functions"
import type { Room } from "../../../cms-public/sanity.types"

// Common crawler user agents
const CRAWLER_PATTERNS = [
  "bot",
  "crawler",
  "spider",
  "googlebot",
  "bingbot",
  "slurp",
  "duckduckbot",
  "facebookexternalhit",
  "twitterbot",
  "linkedinbot",
  "whatsapp",
  "telegrambot",
  "discordbot",
  "slackbot"
]

// Sanity client configuration
const SANITY_DATASET = "production"
const SANITY_API_VERSION = "2025-07-28"

function isCrawler(userAgent: string): boolean {
  const ua = userAgent.toLowerCase()
  return CRAWLER_PATTERNS.some(pattern => ua.includes(pattern))
}

async function fetchRoomData(roomId: string, sanityProjectId: string) {
  const query = `*[_type == "room" && _id == $id][0]`
  const url = `https://${sanityProjectId}.api.sanity.io/v${SANITY_API_VERSION}/data/query/${SANITY_DATASET}?query=${encodeURIComponent(query)}&$id="${roomId}"`

  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Sanity API error: ${response.status}`)
    }

    const data = await response.json()
    return data.result as Room
  } catch (error) {
    console.error("Error fetching room data:", error)
    return null
  }
}

function generateImageUrl(assetRef: string, sanityProjectId: string): string {
  // Remove "image-" prefix from Sanity asset reference
  const cleanRef = assetRef.replace("image-", "")

  // Handle different image formats
  const formatMappings = [
    { suffix: "-png", extension: ".png" },
    { suffix: "-jpg", extension: ".jpg" },
    { suffix: "-jpeg", extension: ".jpeg" },
    { suffix: "-webp", extension: ".webp" },
    { suffix: "-gif", extension: ".gif" },
    { suffix: "-svg", extension: ".svg" }
  ]

  for (const mapping of formatMappings) {
    if (cleanRef.includes(mapping.suffix)) {
      return `https://cdn.sanity.io/images/${sanityProjectId}/${SANITY_DATASET}/${cleanRef.replace(mapping.suffix, mapping.extension)}`
    }
  }

  // Default to PNG if no format is detected
  return `https://cdn.sanity.io/images/${sanityProjectId}/${SANITY_DATASET}/${cleanRef.replace("-png", ".png")}`
}

function getImageType(imageUrl: string): string {
  if (imageUrl.includes(".jpg") || imageUrl.includes(".jpeg")) return "image/jpeg"
  if (imageUrl.includes(".webp")) return "image/webp"
  if (imageUrl.includes(".gif")) return "image/gif"
  if (imageUrl.includes(".svg")) return "image/svg+xml"
  return "image/png" // default
}

function generateMetaTags(room: Room, url: string, sanityProjectId: string) {
  const prompt = room?.prompt || ""
  const ownerName = room?.ownerName || "Unknown"
  const truncatedTitle = prompt.length > 32 ? `${prompt.slice(0, 32)}...` : prompt
  const title = prompt ? `${truncatedTitle} | RAT.FUN` : "RAT.FUN"
  const description = `Creator: ${ownerName}. ${prompt}`
  const imageUrl = room?.image?.asset
    ? generateImageUrl(room.image.asset._ref, sanityProjectId)
    : "https://rat.fun/images/meta.png"
  const imageType = getImageType(imageUrl)

  return `
    <title>${title}</title>
    <meta name="description" content="${description}" />
    <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
    
    <!-- Open Graph -->
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="RAT.FUN" />
    <meta property="og:locale" content="en-us" />
    <meta property="og:url" content="${url}" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:image" content="${imageUrl}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="600" />
    <meta property="og:image:alt" content="rat.fun" />
    <meta property="og:image:type" content="${imageType}" />
    
    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${imageUrl}" />
    <meta name="twitter:creator" content="@movingcastles_" />
  `
}

export default async (request: Request, context: Context) => {
  const url = new URL(request.url)
  const userAgent = request.headers.get("user-agent") || ""

  // Check if this is a crawler request
  if (!isCrawler(userAgent)) {
    return context.next()
  }

  console.log("User agent identified as crawler:", userAgent)

  // Extract roomId from path: /(rooms)/(game)/[roomId]
  const roomId = url.pathname.split("/").pop()

  if (!roomId) {
    console.log("No room found for:", roomId)
    return context.next()
  }

  // Check that room id is a valid 32-byte hex string (64 characters + 0x prefix)
  if (!roomId || !/^0x[a-fA-F0-9]{64}$/.test(roomId)) {
    console.log("Invalid room ID format:", roomId)
    return context.next()
  }

  // Get Sanity project ID from environment
  const sanityProjectId = Netlify.env.get("PUBLIC_SANITY_CMS_ID")

  // Move on if no sanity project ID is not found
  if (!sanityProjectId) {
    console.log("No sanity project ID found")
    return context.next()
  }

  // Fetch room data from Sanity
  const room = await fetchRoomData(roomId, sanityProjectId)
  if (!room) {
    console.log("No room found for:", roomId)
    return context.next()
  }

  // Generate HTML with meta tags
  const metaTags = generateMetaTags(room, url.toString(), sanityProjectId)

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    ${metaTags}
    <link rel="canonical" href="${url.toString()}" />
</head>
<body>
    <div id="app">
        <h1>${room.prompt || "RAT.FUN Room"}</h1>
        <p>Creator: ${room.ownerName || "Unknown"}</p>
        <p>Room ID: ${roomId}</p>
        <p>Visit <a href="${url.toString()}">rat.fun</a> to play!</p>
    </div>
</body>
</html>`

  return new Response(html, {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "public, max-age=3600"
    }
  })
}
