import fetch from "node-fetch"
import { pickRandom } from "@modules/utils"
import Replicate from "replicate"
import type { FileOutput } from "replicate"

import dotenv from "dotenv"
dotenv.config()

const client = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
})

const PRE_PROMPT = "Security camera view of"
const MODEL = "black-forest-labs/flux-dev"
const IMAGE_TEMPLATES = [
  "https://rat-room-pyrope.netlify.app/images/room-templates/room-1.jpg",
  "https://rat-room-pyrope.netlify.app/images/room-templates/room-2.jpg",
  "https://rat-room-pyrope.netlify.app/images/room-templates/room-3.jpg",
  "https://rat-room-pyrope.netlify.app/images/room-templates/room-4.jpg",
  "https://rat-room-pyrope.netlify.app/images/room-templates/room-5.jpg"
]

export const generateImage = async (prompt: string = "A rat") => {
  const input = {
    image: pickRandom(IMAGE_TEMPLATES),
    prompt: `${PRE_PROMPT} ${prompt}.`,
    go_fast: true,
    guidance: 3.5,
    megapixels: "1",
    num_outputs: 1,
    aspect_ratio: "4:3",
    output_format: "webp",
    output_quality: 80,
    prompt_strength: 0.73,
    num_inference_steps: 28,
  }

  try {
    const output = await client.run(MODEL, { input }) as FileOutput[]

    const outputUrl = output[0].url()

    if (!outputUrl) throw new Error("Could not use the output URL")

    const response = await fetch(outputUrl)

    if (!response.ok) {
      throw new Error(
        `Failed to fetch image from Replicate URL: ${response.statusText}`
      )
    }

    // Get as Buffer (simplest for Sanity)
    const imageBuffer = await response.buffer()

    return imageBuffer
  } catch (error) {
    throw new Error(error as string)
  }
}
