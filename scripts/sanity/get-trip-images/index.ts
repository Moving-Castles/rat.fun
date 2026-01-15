import { createClient } from "@sanity/client"
import * as fs from "fs"
import * as path from "path"
import * as https from "https"

const SANITY_PUBLIC_CMS_ID = "saljmqwt"
const TARGET_WORLD_ADDRESS = "0x28d10E6aAb1a749Be792b4D8aa0519c70E83386a"

// Initialize Sanity client
const client = createClient({
  projectId: SANITY_PUBLIC_CMS_ID,
  dataset: "production",
  apiVersion: "2025-04-18",
  useCdn: false
})

interface Trip {
  _id: string
  title: string
  image: string
}

async function downloadImage(url: string, filepath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    https
      .get(url, response => {
        if (response.statusCode !== 200) {
          reject(new Error(`Failed to download image: ${response.statusCode}`))
          return
        }

        const writeStream = fs.createWriteStream(filepath)
        response.pipe(writeStream)

        writeStream.on("finish", () => {
          writeStream.close()
          resolve()
        })

        writeStream.on("error", reject)
      })
      .on("error", reject)
  })
}

async function main() {
  try {
    // Create output directory if it doesn't exist
    const outputDir = path.join(process.cwd(), "downloaded-images")
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir)
    }

    // Fetch all trips from Sanity
    const trips = await client.fetch<
      Trip[]
    >(`*[_type == "trip" && defined(image) && worldAddress == "${TARGET_WORLD_ADDRESS}"  ]{
      _id,
      title,
      "image": image.asset->url
    }`)

    console.log(`Found ${trips.length} trips with images`)

    // Download each image
    for (const trip of trips) {
      if (!trip.image) {
        console.log(`No image URL for trip: ${trip.title}`)
        continue
      }

      const filename = `${trip.title.toLowerCase().replace(/[^a-z0-9]/g, "-")}.jpg`
      const filepath = path.join(outputDir, filename)

      console.log(`Downloading image for trip: ${trip.title}`)
      await downloadImage(trip.image, filepath)
      console.log(`Downloaded: ${filename}`)
    }

    console.log("All images downloaded successfully!")
  } catch (error) {
    console.error("Error:", error)
    process.exit(1)
  }
}

main()
