import { loadData } from "@modules/cms/sanity"
import { queries } from "@modules/cms/groq"
import type { ActivePrompts, Prompt } from "@sanity-types"
import { client } from "./sanity"
// import { createReadStream } from 'fs';

// - - - - - -
// READ
// - - - - - -

type ExpandedActivePrompts = ActivePrompts & {
  activeEventPrompt: Prompt
  activeCorrectionPrompt: Prompt
}

export const getSystemPrompts = async () => {
  const activePrompts = (await loadData(
    queries.activePrompts,
    {}
  )) as ExpandedActivePrompts
  return {
    combinedSystemPrompt: combineSystemPrompts(activePrompts.activeEventPrompt),
    correctionSystemPrompt: combineSystemPrompts(
      activePrompts.activeCorrectionPrompt
    ),
  }
}

function combineSystemPrompts(doc: Prompt) {
  return `Return format: ${doc.returnFormat?.code ?? ""} // ${doc.prompt ?? ""}`
}

// - - - - - -
// WRITE
// - - - - - -

export async function writeRoomToCMS(
  worldAddress: string,
  roomID: string,
  prompt: string,
  imageBuffer: ReadableStream
) {
  const imageAsset = await client.assets.upload("image", imageBuffer, {
    filename: `room-${roomID}.webp`,
  })

  // Create the room document with the uploaded image reference
  const newRoomDoc = {
    _type: "room",
    title: roomID,
    _id: roomID,
    worldAddress: worldAddress,
    prompt,
    image: {
      _type: "image",
      asset: {
        _type: "reference",
        _ref: imageAsset._id,
      },
    },
    slug: {
      _type: "slug",
      current: roomID,
    },
  }

  // Create the room document in Sanity
  const room = await client.create(newRoomDoc)

  return room
}
