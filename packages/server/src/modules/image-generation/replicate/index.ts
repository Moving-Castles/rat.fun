import { pickRandom } from "@modules/utils"
import Replicate from "replicate"
import type { FileOutput } from "replicate"

import dotenv from "dotenv"
dotenv.config()

const client = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
})

const PREPROMPT = "STYLE: "

const MODEL = {
  FLUX: "black-forest-labs/flux-dev",
  SD: "stability-ai/stable-diffusion-3.5-large" //.5-large
}

const PROMPT_1 = [
  "staring",
  "laughing",
  "sad",
  "maniac",
  "crazy",
  "sunlit",
  "crying",
  "beautiful",
  "insane",
  "happy",
  "beefy",
  "encrypted",
  "vulgar",
  "divine",
  "evil",
  "mistaken",
  "pogo",
  "moshpit",
  "moshing",
  "labyrinthine",
  "scammy",
  "wide-eyed",
  "redacted",
  "censored",
  "blazing",
  "blazing fast",
  "corrupted",
  "dadaist",
  "absurd",
  "bad",
  "intense",
  "angelic",
  "radiant",
  "gabber",
  "smiling",
  "flooded",
  "burning",
  "xeroxed",
  "melted",
  "disfigured",
  "bug eyed",
  "cursed",
  "cursed",
  "strobed",
  "crunchy",
  "hyper-accelerated",
  "euphoric",
  "exstatic",
  "trance",
  "crusty",
  "tear-eyed",
  "chunky",
  "gorepunk",
  "screaming",
  "surprised",
  "singing",
  "tortured",
  "yelling",
  "gore",
  "cut-up",
  "howling",
  "pig-nosed",
  "rat-faced",
  "ratty",
  "rotting",
  "humiliated",
  "broken",
  "lookmaxed",
  "merrymaxed",
  "life-maxed",
  "white-pilled",
  "clown-pilled",
  "sublime",
  "sneering",
  "sparkling",
  "alien",
  "vivisection",
  "messy",
  "fairytale",
  "alien faced",
  "embarrased",
  "peaceful",
  "viral",
  "acid",
  "infected",
  "massacre",
  "gore-spattered",
  "acid fried"
]

const PROMPT_2 = [
  "film grain",
  "trashed",
  "aged",
  "decayed",
  "rotting",
  "stained",
  "graffiti",
  "goya",
  "junji ito",
  "allan moore",
  "walt disney",
  "slimepunk",
  "highly detailed",
  "masterwork",
  "extreme texture",
  "macroshot",
  "spray paint",
  "scarred",
  "collage",
  "punk collage",
  "dead kennedys",
  "death metal",
  "john heartfield",
  "mutant",
  "freak",
  "gimp suit",
  "scarred",
  "collage",
  "otto dix",
  "francis bacon",
  "george grosz",
  "kids drawing",
  "naive drawing",
  "drawing",
  "plotter",
  "trash",
  "lo-res",
  "xeroxed",
  "punk zine",
  "deep fried",
  "research chemical",
  "fried",
  "finger painting",
  "digipunk",
  "scrollpunk",
  "john bauer",
  "h.r. giger",
  "4K",
  "griftpunk",
  "tagged",
  "financepunk",
  "corecore",
  "extremely detailed",
  "crust-punk",
  "cursed",
  "fisheye",
  "flamed",
  "joseph beuys",
  "cut-up",
  "metalcore",
  "metallic",
  "crustcore",
  "crust",
  "naive",
  "splatter",
  "air-brushed",
  "black metal",
  "crt",
  "air-brushed",
  "distorted",
  "scanned",
  "inverted",
  "scan",
  "crusted",
  "circus poster",
  "brothers grimm",
  "pain",
  "grimm",
  "sprayed",
  "high contrast",
  "black and white",
  "monochrome",
  "go pro",
  "gorechunk"
]

const IMAGE_TEMPLATES = [
  "https://rat-room-pyrope.netlify.app/images/room-templates/room-1.jpg",
  "https://rat-room-pyrope.netlify.app/images/room-templates/room-2.jpg",
  "https://rat-room-pyrope.netlify.app/images/room-templates/room-3.jpg",
  "https://rat-room-pyrope.netlify.app/images/room-templates/room-4.jpg",
  "https://rat-room-pyrope.netlify.app/images/room-templates/room-5.jpg",
  "https://rat-room-pyrope.netlify.app/images/room-templates/room-6.jpg",
  "https://rat-room-pyrope.netlify.app/images/room-templates/room-7.jpg"
]

const makePrompt = (prompt: string) => {
  const randomPrompt1 = pickRandom(PROMPT_1)
  const randomPrompt2 = pickRandom(PROMPT_1)
  const randomPrompt3 = pickRandom(PROMPT_2)
  const randomPrompt4 = pickRandom(PROMPT_2)
  return `${PREPROMPT} ${randomPrompt1} ${randomPrompt2} ${randomPrompt3} ${randomPrompt4} . Content:${prompt}`
}

export const generateImage = async (prompt: string, levelPrompt: string) => {
  const INPUT = {
    FLUX: {
      image: "https://rat-room-pyrope.netlify.app/images/room-templates/room-8.jpg",
      prompt: makePrompt(prompt),
      go_fast: true,
      guidance: 3.5,
      megapixels: "1",
      num_outputs: 1,
      aspect_ratio: "1:1",
      output_format: "webp",
      output_quality: 80,
      prompt_strength: 0.75, // 0.73
      num_inference_steps: 30, // 28
    },
    SD: {
      image: "https://rat-room-pyrope.netlify.app/images/room-templates/room-8.jpg",
      prompt: makePrompt(prompt),
      cfg: 2,
      aspect_ratio: "1:1",
      output_format: "webp",
      output_quality: 80,
      prompt_strength: 0.68, // 0.73
      steps: 28, // 28
    }
  }

  try {
    const output = await client.run(MODEL.SD, { input: INPUT.SD }) as FileOutput[]

    if (!output[0]) throw new Error("No output received from Replicate")

    // Get the image data directly as a blob
    const blob = await output[0].blob()
    
    // Convert blob to buffer
    const arrayBuffer = await blob.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    return buffer
  } catch (error) {
    throw new Error(error as string)
  }
}
