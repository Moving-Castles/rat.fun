import Replicate from "replicate"
import type { FileOutput } from "replicate"
import sharp from "sharp"
import { PROMPTS } from "./prompts"
import path from "path"
import fs from "fs"
import { program } from "commander"

// Load .env from parent directory
import dotenv from "dotenv"
dotenv.config({ path: path.resolve(__dirname, '../.env') })

const FIXED_PROMPT = "A rat."

const client = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
})

function pickRandomMultiple<T>(array: T[], count: number): T[] {
  return array.sort(() => Math.random() - 0.5).slice(0, count)
}

const MODEL = {
  SD: "stability-ai/stable-diffusion-3.5-large" as const
}

const sanitizePrompt = (prompt: string): string => {
  return prompt
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .substring(0, 50)
}

const createOutputDirectory = (prompt: string): string => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const sanitizedPrompt = sanitizePrompt(prompt)
  const dirName = `${timestamp}_${sanitizedPrompt}`
  const outputDir = path.join(process.cwd(), 'output', dirName)
  
  fs.mkdirSync(outputDir, { recursive: true })

  return outputDir
}

const makePrompt = (prompt: string) => {
  const randomPrompts = pickRandomMultiple(PROMPTS, 4).join(" ")
  return `STYLE: ${randomPrompts}. !! Important !! A scene of: ${prompt}`
}

export const generateImage = async (prompt: string) => {
  const FULL_PROMPT = prompt + FIXED_PROMPT
  const INPUT = {
    SD: {
      image: "https://rat-room-pyrope.netlify.app/images/rat-templates/rat-template.png",
      prompt: makePrompt(prompt),
      cfg: 2,
      aspect_ratio: "1:1",
      output_format: "webp",
      output_quality: 80,
      prompt_strength: 0.72,
      steps: 28,
    }
  }

  // Log prompt to root prompts.txt
  const timecode = new Date().toISOString()
  fs.appendFileSync(
    path.join(process.cwd(), 'prompts.txt'),
    `${timecode}: ${FULL_PROMPT}\n`
  )

  try {
    const output = await client.run(MODEL.SD, { input: INPUT.SD }) as FileOutput[]

    if (!output[0]) throw new Error("No output received from Replicate")

    // Get the image data directly as a blob
    const blob = await output[0].blob()
    
    // Convert blob to buffer
    const arrayBuffer = await blob.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    // Process image with sharp
    const processedBuffer = await sharp(buffer)
      .modulate({
        saturation: 3,
      })
      .toBuffer()

    return processedBuffer
  } catch (error) {
    throw new Error(error as string)
  }
}

const processRun = async (variations: number) => {
  const prompt = FIXED_PROMPT
  console.log(`\nProcessing run with prompt: "${prompt}"`)
  console.log(`Generating ${variations} variations...`)
  
  const outputDir = createOutputDirectory(prompt)
  console.log(`Saving images to: ${outputDir}`)

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
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
    .requiredOption('-n, --number <number>', 'Number of images to generate', parseInt)
    .parse(process.argv)

  const { number } = program.opts()
  await processRun(number)
  console.log('\nAll generations complete!')
}

main().catch(console.error)
