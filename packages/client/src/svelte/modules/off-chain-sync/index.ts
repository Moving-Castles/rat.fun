import { ENVIRONMENT } from "@mud/enums"
import { newEvent } from "@modules/off-chain-sync/stores"

let socket: WebSocket

export function initOffChainSync(environment: ENVIRONMENT, ratId: string) {
  console.log("Initializing off chain sync", environment, ratId)

  let url = `ws://localhost:3131/ws/${ratId}`

  if ([ENVIRONMENT.GARNET].includes(environment)) {
    url = `wss://reality-model-1.mc-infra.com/ws/${ratId}`
  }

  socket = new WebSocket(url)

  socket.onmessage = message => {
    // TODO route messages to appropriate handlers
    console.log("Received message:", message)
    const outcome = JSON.parse(message.data)
    console.log("Received outcome:", outcome)
    newEvent.set(outcome)
  }

  // TODO: Handle socket disconnection

  // TODO: Update client list when players connect/disconnect

  // // Listen for messages
  // socket.addEventListener("message", (event: { data: string }) => {
  //   const msgObj = JSON.parse(event.data)

  //   const { topic, message } = msgObj

  //   switch (topic) {
  //     case "clientId": {
  //       const { clientId } = JSON.parse(event.data)
  //       playerClientId.set(clientId)
  //       console.log("Player client, ", clientId)
  //       break
  //     }

  //     case "clientList": {
  //       clientList.set(msgObj.clients)
  //       console.log("Clients, ", msgObj.clients)
  //       break
  //     }

  //     case "transform": {
  //       clientTransforms.update(m => {
  //         m.set(msgObj.clientId, JSON.parse(message))

  //         return m
  //       })

  //       break
  //     }

  //     case "location": {
  //       clientLocations.update(m => {
  //         m.set(msgObj.clientId, JSON.parse(message))

  //         return m
  //       })

  //       break
  //     }

  //     default: {
  //       console.warn("unhandled message topic: ", topic, msgObj)
  //       break
  //     }
  //   }
  // })
}
