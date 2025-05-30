import { createClient } from '@sanity/client'
import * as fs from 'fs'
import * as path from 'path'
import * as https from 'https'

const SANITY_PUBLIC_CMS_ID = "saljmqwt"
const TARGET_WORLD_ADDRESS = "0x06522e692F64655123512FbdA87a9452cf287602"

// Initialize Sanity client
const client = createClient({
  projectId: SANITY_PUBLIC_CMS_ID,
  dataset: "production",
  apiVersion: "2025-04-18",
  useCdn: false,
})

interface Room {
  _id: string
  title: string
  image: string
}

async function downloadImage(url: string, filepath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download image: ${response.statusCode}`))
        return
      }

      const writeStream = fs.createWriteStream(filepath)
      response.pipe(writeStream)

      writeStream.on('finish', () => {
        writeStream.close()
        resolve()
      })

      writeStream.on('error', reject)
    }).on('error', reject)
  })
}

async function main() {
  try {
    // Create output directory if it doesn't exist
    const outputDir = path.join(process.cwd(), 'downloaded-images')
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir)
    }

    // Fetch all rooms from Sanity
    const rooms = await client.fetch<Room[]>(`*[_type == "room" && defined(image) && worldAddress == "${TARGET_WORLD_ADDRESS}"  ]{
      _id,
      title,
      "image": image.asset->url
    }`)

    console.log(`Found ${rooms.length} rooms with images`)

    // Download each image
    for (const room of rooms) {
      if (!room.image) {
        console.log(`No image URL for room: ${room.title}`)
        continue
      }

      const filename = `${room.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}.jpg`
      const filepath = path.join(outputDir, filename)

      console.log(`Downloading image for room: ${room.title}`)
      await downloadImage(room.image, filepath)
      console.log(`Downloaded: ${filename}`)
    }

    console.log('All images downloaded successfully!')
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

main()
