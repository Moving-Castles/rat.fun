import type { FalseOrTransform } from "@modules/off-chain-sync/types"
import type { ChatMessage } from "@modules/off-chain-sync/types"
import {
  clientList,
  playerClientId,
  clientTransforms,
  clientLocations,
} from "@modules/off-chain-sync/stores"
import { LOCATION } from "@modules/ui/enums"
import { OFF_CHAIN_SYNC_SERVER_URL } from "./constants"
import { get } from "svelte/store"
import { publicNetwork } from "@modules/network"

let socket: WebSocket
let lastTransformUpdate = performance.now()

const TRANSFORM_UPDATE_INTERVAL = 100

export function initOffChainSync(): Promise<void> {
  console.log("Initializing off chain sync")
  return new Promise((resolve, reject) => {
    socket = new WebSocket(OFF_CHAIN_SYNC_SERVER_URL)

    socket.addEventListener("open", event => {
      console.log("Connected to off chain sync", event)
      resolve()
    })

    socket.addEventListener("error", error => {
      console.error("WebSocket error:", error)
      reject()
    })

    // Listen for messages
    socket.addEventListener("message", (event: { data: string }) => {
      const msgObj = JSON.parse(event.data)

      const { topic, message } = msgObj

      switch (topic) {
        case "clientId": {
          const { clientId } = JSON.parse(event.data)
          playerClientId.set(clientId)
          console.log("Player client, ", clientId)
          break
        }

        case "clientList": {
          clientList.set(msgObj.clients)
          console.log("Clients, ", msgObj.clients)
          break
        }

        case "transform": {
          clientTransforms.update(m => {
            m.set(msgObj.clientId, JSON.parse(message))

            return m
          })

          break
        }

        case "location": {
          clientLocations.update(m => {
            m.set(msgObj.clientId, JSON.parse(message))

            return m
          })

          break
        }

        default: {
          console.warn("unhandled message topic: ", topic, msgObj)
          break
        }
      }
    })

    socket.addEventListener("close", () => {
      console.log("socket closed")
    })
  })
}

function setupMessage(address: string, topic: string, message: any) {
  if (!socket) return

  const $publicNetwork = get(publicNetwork)

  if (socket.readyState === socket.OPEN) {
    const timestamp = performance.now()
    const msg: ChatMessage = {
      topic,
      address,
      world: $publicNetwork.worldAddress,
      timestamp,
      id: String(timestamp),
      message: JSON.stringify(message),
    }
    return JSON.stringify(msg)
  }

  return false
}

export async function sendTransform(address: string, t: FalseOrTransform) {
  if (!socket) return

  const now = performance.now()

  // Throttle updates to the server
  if (now - lastTransformUpdate < TRANSFORM_UPDATE_INTERVAL) return

  const msg = setupMessage(address, "transform", t)

  if (msg) {
    socket.send(msg)
    lastTransformUpdate = now
  }
}

export async function sendLocation(address: string, l: LOCATION) {
  if (!socket) return

  const msg = setupMessage(address, "location", l)

  if (msg) socket.send(msg)
}
