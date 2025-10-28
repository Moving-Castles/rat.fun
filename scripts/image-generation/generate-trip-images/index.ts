import Replicate from "replicate"
import type { FileOutput } from "replicate"
import sharp = require("sharp")
import { TRIP_PROMPTS } from "./trip-prompts"
import * as path from "path"
import * as fs from "fs"
import { program } from "commander"

// Load .env from parent directory
import dotenv = require("dotenv")
dotenv.config({ path: path.resolve(__dirname, "../../.env") })

const TRIP_PROMPT = "Paradise on Earth for the rat."

const client = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN
})

const pickRandom = <T>(array: T[]): T => {
  return array[Math.floor(Math.random() * array.length)]
}

const bcPerceptual = async (
  input: Buffer,
  { brightness = 0, contrast = 0 } = {}
): Promise<Buffer> => {
  // Apply brightness and contrast adjustments using Sharp's built-in functions
  // This is a simplified approach that works within Sharp's constraints
  const contrastMultiplier = 1 + contrast / 100
  const brightnessOffset = brightness

  return await sharp(input)
    .linear(contrastMultiplier, brightnessOffset) // Apply contrast and brightness
    .toBuffer()
}

const MODEL = {
  // SD: "google/imagen-4-fast" as const
  SD: "stability-ai/stable-diffusion-3.5-medium" as const
  // SD: "bytedance/sdxl-lightning-4step:5599ed30703defd1d160a25a63321b4dec97101d98b4674bcc56e41f62f35637" as const
}

const sanitizePrompt = (prompt: string): string => {
  return prompt
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "_")
    .replace(/_+/g, "_")
    .substring(0, 100)
}

const createOutputDirectory = (prompt: string): string => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
  const sanitizedPrompt = sanitizePrompt(prompt)
  const dirName = `${timestamp}_${sanitizedPrompt}`
  const outputDir = path.join(process.cwd(), "output", dirName)

  fs.mkdirSync(outputDir, { recursive: true })

  return outputDir
}

const makePrompt = (prompt: string) => {
  // const randomPrompts = pickRandomMultiple(PROMPTS, 2).join(" ")
  const postFix =
    "rat-faced, 4K, highly detailed, high contrast, clear foreground motif, extreme fisheye distortion"
  // unreal engine
  // const postFix =
  // "rat-faced, John heartfield style, casino token, 4K, highly detailed, high contrast, clear foreground motif, extreme fisheye distortion"
  return `A round casino chip depicting: ${prompt}. Aesthetic: ${postFix}`
}

interface GenerationLog {
  timestamp: string
  model: string
  input: {
    prompt: string
    negative_prompt?: string
    cfg?: number
    guidance_scale?: number
    aspect_ratio?: string
    output_format?: string
    output_quality?: number
    prompt_strength?: number
    steps?: number
    num_inference_steps?: number
  }
  output: {
    filename: string
    bufferSize: number
  }
  error?: string
}

/**
 * Generate an image using Replicate (matches server module structure)
 * @param prompt - The prompt for the image
 * @param skipSharpProcessing - Whether to skip sharp image processing
 * @returns The generated image buffer and metadata
 */
export const generateImage = async (prompt: string, skipSharpProcessing: boolean = false) => {
  const fullPrompt = makePrompt(prompt)

  const INPUT = {
    SD: {
      prompt: fullPrompt,
      negative_prompt:
        "video game, illustration, manga, comic, cartoon, anime,drawing, sketch, line art, flat color, abstract, minimalistic, flat, flat shading, flat lighting",
      cfg: 1,
      guidance_scale: 20,
      aspect_ratio: "1:1",
      output_format: "webp",
      output_quality: 100,
      prompt_strength: 1.0,
      steps: 1,
      num_inference_steps: 1
    }
  }

  try {
    const output = await client.run(MODEL.SD as any, { input: INPUT.SD })

    if (!output) {
      throw new Error("No output received from Replicate")
    }

    let buffer: Buffer

    // Handle different output formats (matching server module)
    if (Array.isArray(output) && output[0]) {
      // Legacy format: array of FileOutput objects
      // console.log("Handling array format with FileOutput objects")
      const fileOutput = output[0] as FileOutput

      let blob
      try {
        blob = await fileOutput.blob()
        // console.log("Blob obtained successfully:", blob)
      } catch (blobError) {
        console.error("Error getting blob:", blobError)
        throw new Error(`Failed to get blob from output: ${blobError}`)
      }

      const arrayBuffer = await blob.arrayBuffer()
      buffer = Buffer.from(arrayBuffer)
    } else if (typeof output === "string") {
      // New format: direct URL string
      // console.log("Handling string format (URL):", output)

      try {
        const response = await fetch(output)
        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`)
        }
        const arrayBuffer = await response.arrayBuffer()
        buffer = Buffer.from(arrayBuffer)
        // console.log("Image fetched from URL, buffer size:", buffer.length)
      } catch (fetchError) {
        console.error("Error fetching image from URL:", fetchError)
        throw new Error(`Failed to fetch image from URL: ${fetchError}`)
      }
    } else if (output && typeof output === "object" && "getReader" in output) {
      // Newest format: ReadableStream
      // console.log("Handling ReadableStream format")

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
        // console.log("ReadableStream processed, buffer size:", buffer.length)
      } catch (streamError) {
        console.error("Error processing ReadableStream:", streamError)
        throw new Error(`Failed to process ReadableStream: ${streamError}`)
      }
    } else {
      throw new Error(`Unexpected output format: ${typeof output}`)
    }

    // Process image with sharp (matching server module) unless disabled
    const finalBuffer = skipSharpProcessing
      ? buffer
      : await sharp(buffer)
          // Merge with noise texture first
          .composite([
            {
              input: await sharp(path.join(__dirname, "noise2.png"))
                .modulate({ brightness: 0.3 })
                .toBuffer(),
              blend: "overlay"
            }
          ])
          // Apply brightness/contrast processing
          .toBuffer()
          .then(processedBuffer => bcPerceptual(processedBuffer, { brightness: 10, contrast: 15 }))
          .then(processedBuffer =>
            sharp(processedBuffer)
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
          )

    return {
      buffer: finalBuffer,
      prompt: fullPrompt,
      input: INPUT.SD
    }
  } catch (error) {
    console.error(error)
    throw new Error(error as string)
  }
}

const logGeneration = (outputDir: string, logEntry: GenerationLog) => {
  const logPath = path.join(outputDir, "generation-log.txt")
  const logLine = `${logEntry.timestamp} | ${logEntry.model} | ${logEntry.input.prompt} | ${logEntry.output.filename} | ${logEntry.output.bufferSize} bytes${logEntry.error ? ` | ERROR: ${logEntry.error}` : ""}\n`

  // Append to generation log
  fs.appendFileSync(logPath, logLine)

  // Also append to detailed JSON log
  const jsonLogPath = path.join(outputDir, "generation-details.json")
  const existingLogs = fs.existsSync(jsonLogPath)
    ? JSON.parse(fs.readFileSync(jsonLogPath, "utf8"))
    : []
  existingLogs.push(logEntry)
  fs.writeFileSync(jsonLogPath, JSON.stringify(existingLogs, null, 2))
}

const processRun = async (
  variations: number,
  skipSharpProcessing: boolean = false,
  useRandomTrip: boolean = false
) => {
  const basePrompt = useRandomTrip ? "Random trip prompts" : TRIP_PROMPT
  console.log(
    `\nProcessing run with ${useRandomTrip ? "random trip prompts" : `prompt: "${basePrompt}"`}`
  )
  console.log(`Generating ${variations} variations...`)

  const outputDir = createOutputDirectory(basePrompt)
  console.log(`Saving images to: ${outputDir}`)

  // Write run metadata
  const runMetadata = {
    timestamp: new Date().toISOString(),
    prompt: basePrompt,
    variations,
    model: MODEL.SD,
    outputDirectory: outputDir,
    skipSharpProcessing,
    useRandomTrip
  }
  fs.writeFileSync(path.join(outputDir, "run-metadata.json"), JSON.stringify(runMetadata, null, 2))

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
  let successCount = 0
  let errorCount = 0

  for (let i = 0; i < variations; i++) {
    // Use random trip prompt for each image if flag is enabled
    const currentPrompt = useRandomTrip ? pickRandom(TRIP_PROMPTS) : TRIP_PROMPT
    console.log(`Generating image ${i + 1}/${variations} with prompt: "${currentPrompt}"`)
    const generationTimestamp = new Date().toISOString()

    try {
      const result = await generateImage(currentPrompt, skipSharpProcessing)
      const { buffer: imageBuffer, prompt: fullPrompt, input } = result

      const sanitizedPrompt = sanitizePrompt(fullPrompt)
      const filename = `${timestamp}__${i + 1}__${sanitizedPrompt}.webp`
      const outputPath = path.join(outputDir, filename)

      fs.writeFileSync(outputPath, imageBuffer)
      console.log(`✓ Saved image to: ${outputPath}`)

      // Log successful generation
      const logEntry: GenerationLog = {
        timestamp: generationTimestamp,
        model: MODEL.SD,
        input: {
          prompt: fullPrompt,
          cfg: input.cfg,
          aspect_ratio: input.aspect_ratio,
          output_format: input.output_format,
          output_quality: input.output_quality,
          prompt_strength: input.prompt_strength,
          steps: input.steps
        },
        output: {
          filename,
          bufferSize: imageBuffer.length
        }
      }

      logGeneration(outputDir, logEntry)
      successCount++
    } catch (error) {
      console.error(`✗ Error generating image ${i + 1}:`, error)
      errorCount++

      // Log failed generation
      const logEntry: GenerationLog = {
        timestamp: generationTimestamp,
        model: MODEL.SD,
        input: {
          prompt: currentPrompt,
          negative_prompt:
            "video game, illustration, manga, comic, cartoon, anime,drawing, sketch, line art, flat color, abstract, minimalistic, flat, flat shading, flat lighting",
          cfg: 10, // 2
          guidance_scale: 50,
          aspect_ratio: "1:1",
          output_format: "webp",
          output_quality: 80,
          prompt_strength: 0.8,
          steps: 28,
          num_inference_steps: 1
        },
        output: {
          filename: `failed_${i + 1}`,
          bufferSize: 0
        },
        error: error instanceof Error ? error.message : String(error)
      }

      logGeneration(outputDir, logEntry)
    }
  }

  console.log(`\nGeneration complete!`)
  console.log(`✓ Successful: ${successCount}`)
  console.log(`✗ Failed: ${errorCount}`)
  console.log(`📁 Output directory: ${outputDir}`)
}

const main = async () => {
  program
    .requiredOption("-n, --number <number>", "Number of images to generate", parseInt)
    .option("--skip-sharp", "Skip sharp image processing (saturation adjustment)")
    .option("--random-trip", "Use random trip prompts from TRIP_PROMPTS for each image")
    .parse(process.argv)

  const { number, skipSharp, randomTrip } = program.opts()
  await processRun(number, skipSharp, randomTrip)
  console.log("\nAll generations complete!")
}

main().catch(console.error)
