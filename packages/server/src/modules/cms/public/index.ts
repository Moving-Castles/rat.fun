import type { Outcome as OutcomeDoc, Trip as TripDoc } from "@sanity-public-cms-types"
import type { ResolvedTemplateImages } from "@modules/types"
import type { Rat, Trip, Player, DebuggingInfo } from "@modules/types"
import type { CorrectionReturnValue, OutcomeReturnValue } from "@modules/types"
import { loadDataPublicSanity } from "@modules/cms/public/sanity"
import { queries } from "@modules/cms/public/groq"

import { publicSanityClient } from "@modules/cms/public/sanity"
import { v4 as uuidv4 } from "uuid"
import { CMSError, CMSAPIError, CMSDataError } from "@modules/error-handling/errors"

// Define a type for new outcome documents that omits Sanity-specific fields
type NewOutcomeDoc = Omit<OutcomeDoc, "_createdAt" | "_updatedAt" | "_rev">
type NewTripDoc = Omit<TripDoc, "_createdAt" | "_updatedAt" | "_rev">

/**
 * Template images are used as base for the trip image generation
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
 * Write trip text metadata to offchain CMS.
 * Called immediately after trip creation onchain.
 * @param worldAddress - The world address of the trip
 * @param tripIndex - The index of the trip
 * @param tripID - The ID of the trip
 * @param prompt - The prompt for the trip
 * @param player - The player who created the trip
 * @returns The trip document
 */
export async function writeTripToCMS(
  worldAddress: string,
  tripIndex: number,
  tripID: string,
  prompt: string,
  player: Player
): Promise<TripDoc> {
  try {
    // Create the trip document without image reference
    const newTripDoc: NewTripDoc = {
      _type: "trip",
      title: tripID,
      _id: tripID,
      worldAddress: worldAddress,
      index: tripIndex,
      owner: player.id,
      ownerName: player.name,
      prompt,
      slug: {
        _type: "slug",
        current: tripID
      }
    }

    // Create the trip document in Sanity
    const trip = (await publicSanityClient.create(newTripDoc)) as TripDoc

    return trip
  } catch (error) {
    // If it's already one of our custom errors, rethrow it
    if (error instanceof CMSError) {
      throw error
    }

    // Otherwise, wrap it in our custom error
    throw new CMSAPIError(
      `Error writing trip text to CMS: ${error instanceof Error ? error.message : String(error)}`,
      error
    )
  }
}

/**
 * Update trip document with image.
 * Called after image generation is complete.
 * @param tripID - The ID of the trip
 * @param imageBuffer - The generated trip image
 * @returns The updated trip document
 */
export async function updateTripWithImage(tripID: string, imageBuffer: Buffer): Promise<TripDoc> {
  try {
    const imageAsset = await publicSanityClient.assets.upload("image", imageBuffer, {
      filename: `trip-${tripID}.webp`
    })

    // Update the trip document with the image reference
    const trip = (await publicSanityClient
      .patch(tripID)
      .set({
        image: {
          _type: "image",
          asset: {
            _type: "reference",
            _ref: imageAsset._id
          }
        }
      })
      .commit()) as TripDoc

    return trip
  } catch (error) {
    // If it's already one of our custom errors, rethrow it
    if (error instanceof CMSError) {
      throw error
    }

    // Otherwise, wrap it in our custom error
    throw new CMSAPIError(
      `Error updating trip with image: ${error instanceof Error ? error.message : String(error)}`,
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
  trip: Trip,
  rat: Rat,
  newTripValue: number,
  tripValueChange: number,
  newRatValue: number,
  ratValueChange: number,
  events: CorrectionReturnValue,
  outcome: OutcomeReturnValue,
  debuggingInfo: DebuggingInfo
): Promise<OutcomeDoc> {
  try {
    const outcomeID = uuidv4()

    const debuggingInfoString = JSON.stringify(debuggingInfo)

    const newOutcomeDoc: NewOutcomeDoc = {
      _type: "outcome",
      title: outcomeID,
      _id: outcomeID,
      worldAddress: worldAddress,
      playerId: player.id,
      tripId: trip.id,
      tripIndex: Number(trip.index),
      log: createOutcomeEvents(events),
      ratId: rat.id,
      ratName: rat.name,
      tripValue: newTripValue,
      tripValueChange: tripValueChange,
      ratValue: newRatValue,
      ratValueChange: ratValueChange,
      playerName: player.name,
      debuggingInfo: debuggingInfoString,
      slug: {
        _type: "slug",
        current: outcomeID
      }
    }

    if (outcome.balanceTransfers) {
      newOutcomeDoc.balanceTransfers = createBalanceTransfers(outcome.balanceTransfers)
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

function createBalanceTransfers(balanceTransfers: OutcomeReturnValue["balanceTransfers"]) {
  return balanceTransfers.map(balanceTransfer => ({
    _key: uuidv4(),
    logStep: balanceTransfer.logStep,
    amount: balanceTransfer.amount
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
