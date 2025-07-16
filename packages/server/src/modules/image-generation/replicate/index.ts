import { pickRandomMultiple } from "@modules/utils"
import { PROMPTS } from "./prompts"
import Replicate from "replicate"
import type { FileOutput } from "replicate"
import sharp from "sharp"
import { ReplicateError } from "@modules/error-handling/errors"
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

import dotenv from "dotenv"
dotenv.config()

const client = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN
})

const MODEL = {
  SD: "stability-ai/stable-diffusion-3.5-large"
}

const makePrompt = (prompt: string) => {
  const randomPrompts = pickRandomMultiple(PROMPTS, 4).join(" ")
  return `STYLE: ${randomPrompts}. !! Important !! A scene of: ${prompt}`
}

export const generateImage = async (prompt: string) => {
  // Get the directory path for ES modules
  const __filename = fileURLToPath(import.meta.url)
  const __dirname = path.dirname(__filename)

  // Read the local image file
  const imagePath = path.join(__dirname, "room-image-templates", "room-image-template-1.jpg")
  const imageBuffer = fs.readFileSync(imagePath)

  const INPUT = {
    SD: {
      image: imageBuffer,
      prompt: makePrompt(prompt),
      cfg: 2,
      aspect_ratio: "1:1",
      output_format: "webp",
      output_quality: 80,
      prompt_strength: 0.72,
      steps: 28
    }
  }

  try {
    const output = (await client.run(MODEL.SD as any, { input: INPUT.SD })) as FileOutput[]

    if (!output[0]) throw new ReplicateError("No output received from Replicate")

    // Get the image data directly as a blob
    const blob = await output[0].blob()

    // Convert blob to buffer
    const arrayBuffer = await blob.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Process image with sharp
    const processedBuffer = await sharp(buffer)
      .modulate({
        saturation: 3
      })
      .toBuffer()

    return processedBuffer
  } catch (error) {
    throw new ReplicateError(error as string, error)
  }
}
