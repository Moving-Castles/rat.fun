import type { Context } from "@netlify/edge-functions"

export default async (request: Request, context: Context) => {
  console.log("=== TEST EDGE FUNCTION CALLED ===")
  console.log("URL:", request.url)
  console.log("User-Agent:", request.headers.get("user-agent"))

  return new Response("Edge function test works!", {
    status: 200,
    headers: {
      "content-type": "text/plain"
    }
  })
}
