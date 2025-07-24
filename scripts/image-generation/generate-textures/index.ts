import Replicate from "replicate"
import type { FileOutput } from "replicate"
import sharp from "sharp"
import dotenv from "dotenv"
import path from "path"
import fs from "fs"
import { program } from "commander"

// Load .env from parent directory
dotenv.config({ path: path.resolve(__dirname, "../../.env") })

const FIXED_PROMPT =
  " Absolutely flat texture. Seamless. Hyperrealistic. Extreme detail. 4K. Trending on artstation. Unreal engine."

const client = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN
})

const MODEL = {
  MATERIAL_DIFFUSION:
    "tstramer/material-diffusion:a42692c54c0f407f803a0a8a9066160976baedb77c91171a01730f9b0d7beeff" as const,
  SD: "stability-ai/stable-diffusion-3.5-large" as const
}

interface RunConfig {
  prompt: string
  variations: number
}

const sanitizePrompt = (prompt: string): string => {
  return prompt
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "_")
    .replace(/_+/g, "_")
    .substring(0, 50)
}

const createOutputDirectory = (prompt: string): string => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
  const sanitizedPrompt = sanitizePrompt(prompt)
  const dirName = `${timestamp}_${sanitizedPrompt}`
  const outputDir = path.join(process.cwd(), "output", dirName)

  fs.mkdirSync(outputDir, { recursive: true })

  return outputDir
}

export const generateImage = async (prompt: string) => {
  const FULL_PROMPT = prompt + FIXED_PROMPT
  const INPUT = {
    MATERIAL_DIFFUSION: {
      prompt: FULL_PROMPT
    },
    SD: {
      prompt: FULL_PROMPT,
      cfg: 2,
      aspect_ratio: "1:1",
      output_format: "png",
      output_quality: 80,
      prompt_strength: 0.72, // 0.73
      steps: 28 // 28
    }
  }

  // Log prompt to root prompts.txt
  const timecode = new Date().toISOString()
  fs.appendFileSync(path.join(process.cwd(), "prompts.txt"), `${timecode}: ${FULL_PROMPT}\n`)

  try {
    const output = (await client.run(MODEL.SD, { input: INPUT.SD })) as FileOutput[]

    if (!output[0]) throw new Error("No output received from Replicate")

    // Get the image data directly as a blob
    const blob = await output[0].blob()

    // Convert blob to buffer
    const arrayBuffer = await blob.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Process image with sharp
    // const processedBuffer = await sharp(buffer)
    //   .modulate({
    //     saturation: 3, // Increase saturation by 20%
    //   })
    //   .toBuffer()

    return buffer
  } catch (error) {
    throw new Error(error as string)
  }
}

const processRun = async (config: RunConfig) => {
  const { prompt, variations } = config
  console.log(`\nProcessing run with prompt: "${prompt}"`)
  console.log(`Generating ${variations} variations...`)

  const outputDir = createOutputDirectory(prompt)
  console.log(`Saving images to: ${outputDir}`)

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
  const sanitizedPrompt = sanitizePrompt(prompt)

  for (let i = 0; i < variations; i++) {
    console.log(`Generating image ${i + 1}/${variations}...`)
    try {
      const imageBuffer = await generateImage(prompt)
      const outputPath = path.join(outputDir, `${timestamp}__${i + 1}__${sanitizedPrompt}.png`)
      fs.writeFileSync(outputPath, imageBuffer)
      console.log(`Saved image to: ${outputPath}`)
    } catch (error) {
      console.error(`Error generating image ${i + 1}:`, error)
    }
  }
}

const main = async () => {
  program
    .option("-p, --prompt <string>", "The prompt to generate images from")
    .option("-n, --number <number>", "Number of images to generate", parseInt)
    .option("-f, --file <string>", "JSON file containing multiple runs configuration")
    .parse(process.argv)

  const options = program.opts()

  if (options.file) {
    try {
      const configFile = fs.readFileSync(options.file, "utf-8")
      const runs: RunConfig[] = JSON.parse(configFile)

      console.log(`Processing ${runs.length} runs from configuration file...`)

      for (const run of runs) {
        await processRun(run)
      }
    } catch (error) {
      console.error("Error processing configuration file:", error)
      process.exit(1)
    }
  } else if (options.prompt && options.number) {
    await processRun({ prompt: options.prompt, variations: options.number })
  } else {
    console.error(
      "Either provide both --prompt and --number, or use --file with a JSON configuration"
    )
    process.exit(1)
  }

  console.log("\nAll generations complete!")
}

main().catch(console.error)
