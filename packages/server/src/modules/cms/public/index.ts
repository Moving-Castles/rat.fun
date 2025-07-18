import type { Outcome as OutcomeDoc, Room as RoomDoc } from "@sanity-public-cms-types"
import type { ResolvedTemplateImages } from "@modules/types"
import type { Rat, Room, Player } from "@modules/types"
import type { CorrectionReturnValue, OutcomeReturnValue } from "@modules/types"
import { loadDataPublicSanity } from "@modules/cms/public/sanity"
import { queries } from "@modules/cms/public/groq"

import { publicSanityClient } from "@modules/cms/public/sanity"
import { v4 as uuidv4 } from "uuid"
import { CMSError, CMSAPIError, CMSDataError } from "@modules/error-handling/errors"

// Define a type for new outcome documents that omits Sanity-specific fields
type NewOutcomeDoc = Omit<OutcomeDoc, "_createdAt" | "_updatedAt" | "_rev">
type NewRoomDoc = Omit<RoomDoc, "_createdAt" | "_updatedAt" | "_rev">

/**
 * Template images are used as base for the room image generation
 * @returns The template images document
 */
export const getTemplateImages = async () => {
  try {
    const templateImages = (await loadDataPublicSanity(
      queries.templateImages,
      {}
    )) as ResolvedTemplateImages

    if (!templateImages) {
      throw new CMSDataError("Missing template images data", templateImages)
    }

    return templateImages
  } catch (error) {
    // If it's already one of our custom errors, rethrow it
    if (error instanceof CMSError) {
      throw error
    }

    // Otherwise, wrap it in our custom error
    throw new CMSAPIError(
      `Error fetching template images: ${error instanceof Error ? error.message : String(error)}`,
      error
    )
  }
}

/**
 * Write room metadata to offchain CMS.
 * Mostly used for the room image.
 * @param worldAddress - The world address of the room
 * @param roomID - The ID of the room
 * @param prompt - The prompt for the room
 * @param player - The player who created the room
 * @param imageBuffer - Generate room image
 * @returns The room document
 */
export async function writeRoomToCMS(
  worldAddress: string,
  roomID: string,
  prompt: string,
  player: Player,
  imageBuffer: Buffer
): Promise<RoomDoc> {
  try {
    const imageAsset = await publicSanityClient.assets.upload("image", imageBuffer, {
      filename: `room-${roomID}.webp`
    })

    // Create the room document with the uploaded image reference
    const newRoomDoc: NewRoomDoc = {
      _type: "room",
      title: roomID,
      _id: roomID,
      worldAddress: worldAddress,
      owner: player.id,
      ownerName: player.name,
      prompt,
      image: {
        _type: "image",
        asset: {
          _type: "reference",
          _ref: imageAsset._id
        }
      },
      slug: {
        _type: "slug",
        current: roomID
      }
    }

    // Create the room document in Sanity
    const room = (await publicSanityClient.create(newRoomDoc)) as RoomDoc

    return room
  } catch (error) {
    // If it's already one of our custom errors, rethrow it
    if (error instanceof CMSError) {
      throw error
    }

    // Otherwise, wrap it in our custom error
    throw new CMSAPIError(
      `Error writing room to CMS: ${error instanceof Error ? error.message : String(error)}`,
      error
    )
  }
}

/**
 * Write outcome to offchain CMS.
 * Used to display statistics in the client.
 */
export async function writeOutcomeToCMS(
  worldAddress: string,
  player: Player,
  room: Room,
  rat: Rat,
  newRoomValue: number,
  roomValueChange: number,
  newRatValue: number,
  ratValueChange: number,
  newRatHealth: number,
  events: CorrectionReturnValue,
  outcome: OutcomeReturnValue
): Promise<OutcomeDoc> {
  try {
    const outcomeID = uuidv4()

    const newOutcomeDoc: NewOutcomeDoc = {
      _type: "outcome",
      title: outcomeID,
      _id: outcomeID,
      worldAddress: worldAddress,
      playerId: player.id,
      roomId: room.id,
      roomIndex: Number(room.index),
      log: createOutcomeEvents(events),
      ratId: rat.id,
      ratName: rat.name,
      ratHealth: newRatHealth,
      roomValue: newRoomValue,
      roomValueChange: roomValueChange,
      ratValue: newRatValue,
      ratValueChange: ratValueChange,
      playerName: player.name,
      slug: {
        _type: "slug",
        current: outcomeID
      }
    }

    // Health change
    if (outcome.healthChange) {
      newOutcomeDoc.healthChange = createHealthChange(outcome.healthChange)
    }

    if (outcome.balanceTransfer) {
      newOutcomeDoc.balanceTransfer = createBalanceTransfer(outcome.balanceTransfer)
    }

    // Trait changes
    if (outcome.traitChanges && outcome.traitChanges.length > 0) {
      newOutcomeDoc.traitChanges = createTraitChanges(outcome.traitChanges)
    }

    // Item changes
    if (outcome.itemChanges && outcome.itemChanges.length > 0) {
      newOutcomeDoc.itemChanges = createItemChanges(outcome.itemChanges)
    }

    // Create the outcome document in Sanity
    const outcomeDoc = (await publicSanityClient.create(newOutcomeDoc)) as OutcomeDoc

    return outcomeDoc
  } catch (error) {
    // If it's already one of our custom errors, rethrow it
    if (error instanceof CMSError) {
      throw error
    }

    // Otherwise, wrap it in our custom error
    throw new CMSAPIError(
      `Error writing outcome to CMS: ${error instanceof Error ? error.message : String(error)}`,
      error
    )
  }
}

// - - - - - -
// HELPERS
// - - - - - -

function createOutcomeEvents(events: CorrectionReturnValue) {
  return (events?.log ?? []).map(event => ({
    _key: uuidv4(),
    event: event.event,
    timestamp: event.timestamp
  }))
}

function createHealthChange(healthChange: OutcomeReturnValue["healthChange"]) {
  return {
    _key: uuidv4(),
    logStep: healthChange.logStep,
    amount: healthChange.amount
  }
}

function createBalanceTransfer(balanceTransfer: OutcomeReturnValue["balanceTransfer"]) {
  return {
    _key: uuidv4(),
    logStep: balanceTransfer.logStep,
    amount: balanceTransfer.amount
  }
}

function createTraitChanges(traitChanges: OutcomeReturnValue["traitChanges"]) {
  return traitChanges.map(traitChange => ({
    _key: uuidv4(),
    logStep: traitChange.logStep,
    type: traitChange.type,
    name: traitChange.name,
    value: traitChange.value,
    id: traitChange.id ?? ""
  }))
}

function createItemChanges(itemChanges: OutcomeReturnValue["itemChanges"]) {
  return itemChanges.map(itemChange => ({
    _key: uuidv4(),
    logStep: itemChange.logStep,
    type: itemChange.type,
    name: itemChange.name,
    value: itemChange.value,
    id: itemChange.id ?? ""
  }))
}
