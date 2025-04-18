import { client } from "./index"
import fetch from "node-fetch"

export const generateImage = async (prompt: string = "A rat") => {
  const input = {
    image: "https://rat-room-pyrope.netlify.app/images/room.png", // switch to png for 4:3 :upside_down_smiley_face:
    prompt: "security camera view of {PROMPT}. tiles",
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

  input.prompt = input.prompt.replace("{PROMPT}", prompt)

  try {
    const output = await client.run("black-forest-labs/flux-dev", { input })

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
    throw new Error(error)
  }
}
