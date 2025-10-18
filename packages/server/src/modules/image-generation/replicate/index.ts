import { ResolvedTemplateImages } from "@modules/types"
import { pickRandom } from "@modules/utils"
import Replicate from "replicate"
import type { FileOutput } from "replicate"
import sharp from "sharp"
import { ReplicateError } from "@modules/error-handling/errors"
import * as path from "path"
import { fileURLToPath } from "url"

import dotenv from "dotenv"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config()

const client = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN
})

const MODEL = {
  SD: "stability-ai/stable-diffusion-3.5-medium"
}

const makePrompt = (prompt: string) => {
  // const randomPrompts = pickRandomMultiple(PROMPTS, 2).join(" ")
  const postFix = "rat-faced, 4K, highly detailed, high contrast,  extreme fisheye distortion"
  return `SCENE: ${prompt}. STYLE: ${postFix}`
}

/**
 * Generate an image using Replicate
 * @param prompt - The prompt for the image
 * @param templateImages - The template images to use for the image
 * @returns The generated image
 */
export const generateImage = async (prompt: string, templateImages: ResolvedTemplateImages) => {
  // Pick a random image from tripImages
  const image = templateImages?.tripImages ? pickRandom(templateImages.tripImages) : undefined

  const INPUT = {
    SD: {
      image,
      prompt: makePrompt(prompt),
      cfg: 1.3,
      aspect_ratio: "1:1",
      output_format: "webp",
      output_quality: 100,
      prompt_strength: 1.0,
      steps: 1
    }
  }

  try {
    const output = await client.run(MODEL.SD as any, { input: INPUT.SD })

    if (!output) {
      throw new ReplicateError("No output received from Replicate")
    }

    let buffer: Buffer

    // Handle different output formats
    if (Array.isArray(output) && output[0]) {
      // Legacy format: array of FileOutput objects
      console.log("Handling array format with FileOutput objects")
      const fileOutput = output[0] as FileOutput

      let blob
      try {
        blob = await fileOutput.blob()
        console.log("Blob obtained successfully:", blob)
      } catch (blobError) {
        console.error("Error getting blob:", blobError)
        throw new ReplicateError(`Failed to get blob from output: ${blobError}`)
      }

      const arrayBuffer = await blob.arrayBuffer()
      buffer = Buffer.from(arrayBuffer)
    } else if (typeof output === "string") {
      // New format: direct URL string
      console.log("Handling string format (URL):", output)

      try {
        const response = await fetch(output)
        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`)
        }
        const arrayBuffer = await response.arrayBuffer()
        buffer = Buffer.from(arrayBuffer)
        console.log("Image fetched from URL, buffer size:", buffer.length)
      } catch (fetchError) {
        console.error("Error fetching image from URL:", fetchError)
        throw new ReplicateError(`Failed to fetch image from URL: ${fetchError}`)
      }
    } else if (output && typeof output === "object" && "getReader" in output) {
      // Newest format: ReadableStream
      console.log("Handling ReadableStream format")

      try {
        const reader = (output as ReadableStream<Uint8Array>).getReader()
        const chunks: Uint8Array[] = []

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          chunks.push(value)
        }

        // Combine all chunks into a single buffer
        const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0)
        const combinedBuffer = new Uint8Array(totalLength)
        let offset = 0

        for (const chunk of chunks) {
          combinedBuffer.set(chunk, offset)
          offset += chunk.length
        }

        buffer = Buffer.from(combinedBuffer)
        console.log("ReadableStream processed, buffer size:", buffer.length)
      } catch (streamError) {
        console.error("Error processing ReadableStream:", streamError)
        throw new ReplicateError(`Failed to process ReadableStream: ${streamError}`)
      }
    } else {
      throw new ReplicateError(`Unexpected output format: ${typeof output}`)
    }

    // Process image with sharp
    const processedBuffer = await sharp(buffer)
      // Merge with noise texture first
      .composite([
        {
          input: await sharp(path.join(__dirname, "noise.png"))
            .modulate({ brightness: 0.3 })
            .toBuffer(),
          blend: "overlay"
        }
      ])
      // Add coarse grain before sharp modulation
      // .convolve({
      //   width: 3,
      //   height: 3,
      //   kernel: [-1, -1, -1, -1, 9, -1, -1, -1, -1]
      // })
      // .linear(1.5, 20) // Contrast: 1.5x multiplier, Brightness: +20 offset
      .modulate({
        saturation: 2,
        hue: Math.floor(Math.random() * 360)
      })
      .toBuffer()

    return processedBuffer
  } catch (error) {
    console.error(error)
    throw new ReplicateError(error as string, error)
  }
}
