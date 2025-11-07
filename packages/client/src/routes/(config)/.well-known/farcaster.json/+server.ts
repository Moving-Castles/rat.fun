import type { RequestHandler } from "./$types"

export const GET: RequestHandler = async () => {
  const farcasterConfig = {
    accountAssociation: {
      header:
        "eyJmaWQiOjkxNTIsInR5cGUiOiJjdXN0b2R5Iiwia2V5IjoiMHgwMmVmNzkwRGQ3OTkzQTM1ZkQ4NDdDMDUzRURkQUU5NDBEMDU1NTk2In0",
      payload: "eyJkb21haW4iOiJhcHAuZXhhbXBsZS5jb20ifQ",
      signature:
        "MHgxMGQwZGU4ZGYwZDUwZTdmMGIxN2YxMTU2NDI1MjRmZTY0MTUyZGU4ZGU1MWU0MThiYjU4ZjVmZmQxYjRjNDBiNGVlZTRhNDcwNmVmNjhlMzQ0ZGQ5MDBkYmQyMmNlMmVlZGY5ZGQ0N2JlNWRmNzMwYzUxNjE4OWVjZDJjY2Y0MDFj"
    },
    baseBuilder: {
      ownerAddress: "0x..."
    },
    miniapp: {
      version: "1",
      name: "Crypto Portfolio Tracker",
      homeUrl: "https://rat.fun",
      iconUrl: "https://rat.fun/images/product/icon.png",
      splashImageUrl: "https://rat.fun/images/product/splash.png",
      splashBackgroundColor: "#000000",
      // webhookUrl: "https://rat.fun/api/webhook", // for notifications
      subtitle: "",
      description: "",
      screenshotUrls: [
        "https://rat.fun/images/product/s1.png",
        "https://rat.fun/images/product/s2.png",
        "https://rat.fun/images/product/s3.png"
      ],
      primaryCategory: "games",
      tags: [],
      heroImageUrl: "https://rat.fun/images/product/hero.png",
      tagline: "",
      ogTitle: "",
      ogDescription: "",
      ogImageUrl: "https://rat.fun/images/product/hero.png",
      noindex: true
    }
  }

  try {
    return new Response(JSON.stringify(farcasterConfig), {
      headers: {
        ContentType: "application/json",
        "Cache-Control": "public, max-age=3600" // Cache for 1 hour
      }
    })
  } catch (error) {}
}
