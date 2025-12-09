import type {
  Outcome as OutcomeDoc,
  Trip as TripDoc,
  Statistics as StatisticsDoc,
  TripFolderList as TripFolderListDoc,
  TripFolder as TripFolderDoc
} from "@sanity-public-cms-types"
import type { Rat, Trip, Player } from "@modules/types"
import type { CorrectionReturnValue, OutcomeReturnValue } from "@modules/types"
import { loadDataPublicSanity } from "@modules/cms/public/sanity"
import { queries } from "@modules/cms/public/groq"

import { publicSanityClient } from "@modules/cms/public/sanity"
import { CMSError, CMSAPIError } from "@modules/error-handling/errors"
import { createBaseOutcomeDocument } from "@modules/cms/shared"

type NewTripDoc = Omit<TripDoc, "_createdAt" | "_updatedAt" | "_rev">
type ExpandedTripFolderListDoc = Omit<TripFolderListDoc, "folders"> & { folders: TripFolderDoc[] }

/**
 * Validate that a folder ID exists in the trip folder list and is not restricted,
 * or if restricted, that the user is whitelisted
 * @param folderId - The ID of the folder to validate
 * @param callerAddress - Optional caller address to check against whitelist
 * @returns True if the folder is valid and accessible
 * @throws CMSAPIError if the folder is invalid or not accessible
 */
export const validateTripFolder = async (
  folderId: string,
  callerAddress?: string
): Promise<boolean> => {
  try {
    const folderList = (await loadDataPublicSanity(
      queries.tripFolderList,
      {}
    )) as ExpandedTripFolderListDoc

    if (!folderList || !folderList.folders || !Array.isArray(folderList.folders)) {
      throw new CMSAPIError("Trip folder list not found or invalid", null)
    }

    const folder = folderList.folders.find(f => f._id === folderId)

    if (!folder) {
      throw new CMSAPIError(`Trip folder with ID ${folderId} not found`, null)
    }

    if (folder.restricted) {
      // Check if user is whitelisted
      const whitelist = folderList.whitelist || []
      const isWhitelisted =
        callerAddress &&
        whitelist.some((addr: string) => addr.toLowerCase() === callerAddress.toLowerCase())

      if (!isWhitelisted) {
        throw new CMSAPIError(
          `Trip folder ${folder.title} is restricted and cannot be used for trip creation`,
          null
        )
      }
    }

    return true
  } catch (error) {
    // If it's already one of our custom errors, rethrow it
    if (error instanceof CMSError) {
      throw error
    }

    // Otherwise, wrap it in our custom error
    throw new CMSAPIError(
      `Error validating trip folder: ${error instanceof Error ? error.message : String(error)}`,
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
 * @param folderId - The ID of the trip folder category
 * @returns The trip document
 */
export async function writeTripToCMS(
  worldAddress: string,
  tripIndex: number,
  tripID: string,
  prompt: string,
  player: Player,
  folderId: string
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
      },
      folder: {
        _type: "reference",
        _ref: folderId
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
 * Write outcome to public CMS without sensitive information.
 * Used to display statistics in the client.
 * @param outcomeId - The pre-generated outcome ID for tracking
 * @param worldAddress - The world address
 * @param player - The player who performed the trip
 * @param trip - The trip state BEFORE the visit (old values)
 * @param rat - The rat state BEFORE the visit (old values)
 * @param newTripValue - The trip value AFTER the visit
 * @param tripValueChange - Change in trip value
 * @param newRatValue - The rat value AFTER the visit
 * @param ratValueChange - Change in rat value
 * @param newRatBalance - The rat balance/health AFTER the visit
 * @param events - The corrected event log
 * @param outcome - The validated outcome
 * @param mainProcessingTime - Processing time in ms
 */
export async function writeOutcomeToCMS(
  outcomeId: string,
  worldAddress: string,
  player: Player,
  trip: Trip,
  rat: Rat,
  newTripValue: number,
  tripValueChange: number,
  newRatValue: number,
  ratValueChange: number,
  newRatBalance: number,
  events: CorrectionReturnValue,
  outcome: OutcomeReturnValue,
  mainProcessingTime: number
): Promise<OutcomeDoc> {
  try {
    // Create base outcome document without sensitive fields
    const baseOutcomeDoc = createBaseOutcomeDocument(
      outcomeId,
      worldAddress,
      player,
      trip,
      rat,
      newTripValue,
      tripValueChange,
      newRatValue,
      ratValueChange,
      newRatBalance,
      events,
      outcome,
      mainProcessingTime
    )

    // Create the outcome document in public Sanity
    const outcomeDoc = (await publicSanityClient.create(baseOutcomeDoc)) as OutcomeDoc

    // Update statistics (fire-and-forget, non-critical)
    updateStatistics(worldAddress, ratValueChange, tripValueChange).catch(err => {
      console.error("Failed to update statistics (non-critical):", err)
    })

    return outcomeDoc
  } catch (error) {
    // If it's already one of our custom errors, rethrow it
    if (error instanceof CMSError) {
      throw error
    }

    // Otherwise, wrap it in our custom error
    throw new CMSAPIError(
      `Error writing outcome to public CMS: ${error instanceof Error ? error.message : String(error)}`,
      error
    )
  }
}

export async function updateStatistics(
  worldAddress: string,
  ratValueChange: number,
  tripValueChange: number
) {
  try {
    // Get the document
    const statisticsDocument = await publicSanityClient.fetch(queries.statistics, { worldAddress })

    // Handle the document
    if (statisticsDocument) {
      // Update the values
      await publicSanityClient
        .patch(statisticsDocument._id)
        .set({
          ratTotalBalance: statisticsDocument.ratTotalBalance + ratValueChange,
          tripTotalBalance: statisticsDocument.tripTotalBalance + tripValueChange
        })
        .commit()
      console.log("updated statistics")
    } else {
      // This means a fresh start.
      const initialTripValue =
        (await publicSanityClient.fetch(
          `math::sum(*[_type == "outcome" && worldAddress == $worldAddress].tripValueChange)`,
          { worldAddress }
        )) || 0

      // In the previous calculations, rat value change was wrongly calculated.
      // Therefore we correct the initial value to be the inverse of the sum of tripValueChange
      const initialRatValue = -initialTripValue

      const allOutcomes = (await publicSanityClient.fetch(
        `*[_type == "outcome" && worldAddress == $worldAddress]{ratValueChange, tripValueChange}`,
        { worldAddress }
      )) as OutcomeDoc[]

      let totalBalance = 0
      let totalThroughput = 0

      allOutcomes.forEach(outcome => {
        const { ratValueChange, tripValueChange } = outcome
        totalBalance += (ratValueChange ?? 0) + (tripValueChange ?? 0)
        // Throughput is the absolute value moved (use rat side to avoid double-counting)
        totalThroughput += Math.abs(ratValueChange ?? 0)
      })

      const document = (await publicSanityClient.create({
        _type: "statistics",
        worldAddress,
        title: worldAddress,
        ratTotalBalance: initialRatValue + ratValueChange,
        tripTotalBalance: initialTripValue + tripValueChange,
        totalBalance: totalBalance,
        totalThroughput: totalThroughput
      })) as StatisticsDoc

      console.warn(
        "New statistics document created with initial values for rats: ",
        document.ratTotalBalance,
        " and trips: ",
        document.tripTotalBalance
      )
    }
  } catch (error) {
    // Otherwise, wrap it in our custom error
    throw new CMSAPIError(
      `Error writing statistics to CMS: ${error instanceof Error ? error.message : String(error)}`,
      error
    )
  }
}
