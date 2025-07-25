#!/usr/bin/env ts-node

import dotenv from "dotenv"
dotenv.config({ path: require("path").resolve(__dirname, "../.env") })

import prompts from "prompts"
import chalk from "chalk"
import { WorldEvent } from "./types"
import {
  loadEventDefinitions,
  displayEvent,
  getStateColor,
  writeEventDefinition,
  isValidISODate,
  formatRequiredPropsStatus
} from "./utils"
import { randomUUID } from "crypto"
import { WorldEvent as SanityWorldEvent } from "../../packages/cms-public/sanity.types"
import { createClient } from "@sanity/client"
import { callRemoveWorldEvent, callSetWorldEvent } from "./contract"
import fs from "fs"
import path from "path"

const sanityClient = createClient({
  projectId: process.env.PUBLIC_SANITY_CMS_ID,
  dataset: "production",
  token: process.env.PUBLIC_SANITY_CMS_TOKEN,
  apiVersion: "2024-01-01",
  useCdn: false
})

type EventAction = "back" | "initialise" | "publish" | "activate" | "destroy"

async function postEventMenu(event: WorldEvent): Promise<EventAction> {
  // Build menu options based on event state
  const choices: { title: string; value: EventAction }[] = [
    { title: "Back to listing", value: "back" }
  ]
  if (event.state === "draft") {
    choices.push({ title: "Initialise", value: "initialise" })
  } else if (event.state === "initialised") {
    choices.push({ title: "Publish", value: "publish" })
  } else if (event.state === "published") {
    choices.push({ title: "Activate", value: "activate" })
  } else if (event.state === "activated") {
    choices.push({ title: "Destroy", value: "destroy" })
  }
  const response = await prompts({
    type: "select",
    name: "action",
    message: "Action >>",
    choices
  })
  return response.action
}

async function main(): Promise<void> {
  try {
    while (true) {
      // Load all event definitions from disk
      const events = loadEventDefinitions()

      // Handle case where no events are found
      if (events.length === 0) {
        console.log("No event definitions found.")
        return
      }

      // Prompt the user to select an event
      const response = await prompts({
        type: "select",
        name: "eventIndex",
        message: "Select event:",
        choices: [
          ...events.map(event => {
            const stateColor = getStateColor(event.state)
            return {
              title: `${event.index}: ${event.workingTitle} (${stateColor(event.state)})`,
              value: event.index
            }
          }),
          { title: "Quit", value: "quit" }
        ]
      })

      // Handle case where user cancels or does not select an event
      if (!response.eventIndex) {
        console.log("No event selected.")
        return
      }

      // Handle quit option
      if (response.eventIndex === "quit") {
        console.log("Goodbye")
        return
      }

      // Find the selected event by index
      const event = events.find(e => e.index === response.eventIndex)

      // Handle case where the event is not found (should not happen)
      if (!event) {
        console.log(`Event with index ${response.eventIndex} not found.`)
        return
      }

      // Display the details of the selected event
      displayEvent(event)

      // Show post-event menu and handle actions
      const action = await postEventMenu(event)
      if (action === "back" || !action) {
        continue // Go back to listing
      } else if (action === "initialise") {
        await initialiseEvent(event)
        console.log("\n" + chalk.bgGreen.black("Event initialised successfully"))
      } else if (action === "publish") {
        await publishEvent(event)
        console.log("\n" + chalk.bgGreen.black("Event published successfully"))
      } else if (action === "activate") {
        await activateEvent(event)
        console.log("\n" + chalk.bgGreen.black("Event activated successfully"))
      } else if (action === "destroy") {
        destroyEvent(event)
        console.log("\n" + chalk.bgGreen.black("Event destroyed successfully"))
      }

      // After any action, reload events and continue to listing
      console.log("\nReturning to event listing...\n")
      continue
    }
  } catch (error) {
    console.error(chalk.bgRed.white("Error:"), (error as Error).message)
  }
}

async function initialiseEvent(event: WorldEvent): Promise<void> {
  const required = ["worldAddress"]
  const status = formatRequiredPropsStatus(event, required)
  console.log(status)
  if (!event.worldAddress || event.worldAddress.trim() === "") {
    console.log(
      chalk.bgRed.white(
        "Cannot initialise: world address is not set in the event definition JSON file."
      )
    )
    return
  }
  // Generate a random UUID for the event id
  event.id = randomUUID()
  // Set the title to 'event-<index>'
  event.publication.publicationTitle = `event-${event.index}`
  // Set state to 'initialised'
  event.state = "initialised"
  // Write the updated event back to its JSON file
  writeEventDefinition(event)
  console.log("Event initialised and saved.")
}

async function publishEvent(event: WorldEvent): Promise<void> {
  const required = ["publication.publicationTitle", "publication.activationDateTime"]
  const status = formatRequiredPropsStatus(event, required)
  console.log(status)
  // Check activationDateTime is set and valid
  const activationDate = event.publication.activationDateTime
  if (!activationDate || !isValidISODate(activationDate)) {
    console.log(
      chalk.bgRed.white(
        "Cannot publish: activationDateTime is not set or not a valid ISO date string."
      )
    )
    return
  }
  // Create a new document in public Sanity
  try {
    const doc = {
      _id: event.id,
      _type: "worldEvent",
      title: event.publication.publicationTitle,
      worldAddress: event.worldAddress,
      activationDateTime: activationDate,
      publicationText: event.publication.publicationText || undefined
    }
    const returnedDoc = (await sanityClient.createIfNotExists(doc)) as SanityWorldEvent
    console.log("Publication created in Sanity with ID:", returnedDoc._id)
    // Set state to 'published' and write back to JSON
    event.state = "published"
    writeEventDefinition(event)
    console.log("Event state updated to 'published' in JSON file.")
  } catch (err) {
    console.error(
      chalk.bgRed.white("Failed to create publication in Sanity:"),
      (err as Error).message
    )
  }
}

async function activateEvent(event: WorldEvent): Promise<void> {
  const required = [
    "activation.activationTitle",
    "activation.prompt",
    "activation.activationText",
    "activation.duration"
  ]
  const status = formatRequiredPropsStatus(event, required)
  console.log(status)
  // Verify that all properties in activation prop are set, except image which can be let empty
  if (
    !event.activation.activationTitle ||
    !event.activation.prompt ||
    !event.activation.activationText ||
    event.activation.duration === 0
  ) {
    console.log(
      chalk.bgRed.white(
        "Cannot activate: all properties in activation prop must be set, except image which can be let empty"
      )
    )
    return
  }

  // Send on-chain transaction to create event
  const success = await callSetWorldEvent(event)

  if (success) {
    // If successful, update event in Sanity
    console.log("Event set on chain")
    console.log("Updating event in Sanity")

    // Update the document with the given id
    await sanityClient
      .patch(event.id)
      .set({
        title: event.activation.activationTitle,
        activationText: event.activation.activationText,
        prompt: event.activation.prompt,
        duration: event.activation.duration
      })
      .commit()

    // Update event in JSON file
    event.state = "activated"
    writeEventDefinition(event)
    console.log("Event state updated to 'activated' in JSON file.")

    if (event.activation.image) {
      const imagePath = path.join(
        __dirname,
        "event-definitions",
        event.index.toString(),
        event.activation.image
      )
      if (fs.existsSync(imagePath)) {
        const imageStream = fs.createReadStream(imagePath)
        const asset = await sanityClient.assets.upload("image", imageStream, {
          filename: event.activation.image
        })
        // Patch the document with the image reference
        await sanityClient
          .patch(event.id)
          .set({
            image: {
              _type: "image",
              asset: { _type: "reference", _ref: asset._id }
            }
          })
          .commit()
        console.log("Image uploaded and set in Sanity doc.")
      } else {
        console.warn(chalk.bgYellow.black("Image file not found:"), imagePath)
      }
    }
  } else {
    console.error(chalk.bgRed.white("Failed to set world event on chain"))
  }
}

async function destroyEvent(event: WorldEvent): Promise<void> {
  // Delete the event from Sanity
  await sanityClient.delete(event.id)

  // Send on-chain transaction to remove event and wait for confirmation
  const success = await callRemoveWorldEvent()

  if (success) {
    // Update event in JSON file
    event.state = "draft"
    writeEventDefinition(event)
    console.log("Event state set to 'draft' in JSON file.")
  } else {
    console.error(chalk.bgRed.white("Failed to remove world event on chain"))
  }
}

main()
