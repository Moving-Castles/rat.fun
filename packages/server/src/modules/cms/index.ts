
import type { ActivePrompts, Outcome as OutcomeDoc, Room as RoomDoc, Prompt } from "@sanity-types"
import type { Rat, Room } from "@routes/room/enter/types";
import type { CorrectionReturnValue, OutcomeReturnValue } from '@modules/llm/types'

import { loadData } from "@modules/cms/sanity"
import { queries } from "@modules/cms/groq"
import { client } from "./sanity"
import { v4 as uuidv4 } from 'uuid';

// Define a type for new outcome documents that omits Sanity-specific fields
type NewOutcomeDoc = Omit<OutcomeDoc, '_createdAt' | '_updatedAt' | '_rev'>;
type NewRoomDoc = Omit<RoomDoc, '_createdAt' | '_updatedAt' | '_rev'>;

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
  playerId: string,
  imageBuffer: Buffer
) {
  const imageAsset = await client.assets.upload("image", imageBuffer, {
    filename: `room-${roomID}.webp`,
  })

  // Create the room document with the uploaded image reference
  const newRoomDoc: NewRoomDoc = {
    _type: "room",
    title: roomID,
    _id: roomID,
    worldAddress: worldAddress,
    owner: playerId,
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

export async function writeOutcomeToCMS(
  worldAddress: string,
  playerId: string,
  room: Room,
  rat: Rat,
  events: CorrectionReturnValue,
  outcome: OutcomeReturnValue
) {
  const outcomeID = uuidv4()

  const newOutcomeDoc: NewOutcomeDoc = {
    _type: "outcome",
    title: outcomeID,
    _id: outcomeID,
    worldAddress: worldAddress,
    playerId: playerId,
    roomId: room.id,
    log: createOutcomeEvents(events),
    ratId: rat.id,
    ratName: rat.name,
    slug: {
      _type: "slug",
      current: outcomeID,
    },
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
  const outcomeDoc = await client.create(newOutcomeDoc)

  return outcomeDoc
}

function createOutcomeEvents(events: CorrectionReturnValue) {
  return (events?.log ?? []).map((event) => ({
    _key: uuidv4(),
    event: event.event,
    timestamp: event.timestamp,
  }))
}

function createHealthChange(healthChange: OutcomeReturnValue['healthChange']) {
  return {
    _key: uuidv4(),
    logStep: healthChange.logStep,
    amount: healthChange.amount,
  }
}

function createBalanceTransfer(balanceTransfer: OutcomeReturnValue['balanceTransfer']) {
  return {
    _key: uuidv4(),
    logStep: balanceTransfer.logStep,
    amount: balanceTransfer.amount
  }
}

function createTraitChanges(traitChanges: OutcomeReturnValue['traitChanges']) {
  return traitChanges.map((traitChange) => ({
    _key: uuidv4(),
    logStep: traitChange.logStep,
    type: traitChange.type,
    name: traitChange.name,
    value: traitChange.value,
    id: traitChange.id ?? "",
  }))
}

function createItemChanges(itemChanges: OutcomeReturnValue['itemChanges']) {
  return itemChanges.map((itemChange) => ({
    _key: uuidv4(),
    logStep: itemChange.logStep,
    type: itemChange.type,
    name: itemChange.name,
    value: itemChange.value,
    id: itemChange.id ?? "",
  }))
}