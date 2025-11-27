import type { FastifyInstance, FastifyRequest } from "fastify"
import { Hex } from "viem"
import { v4 as uuidv4 } from "uuid"

import { schema } from "@routes/ws-connect/schema"
import { broadcast, wsConnections, getConnectedPlayerIds } from "@modules/websocket"
import { verifyRequest } from "@modules/signature"
import { PlayerIdMismatchError } from "@modules/error-handling/errors"

import type { WebSocketParams, SignedRequest, SignedRequestInfo } from "@modules/types"

async function routes(fastify: FastifyInstance) {
  // Health check endpoint
  fastify.get("/healthz", async () => {
    return { status: "ok", connections: wsConnections.size }
  })

  // Fastify 5 TypeProvider issue: websocket option not recognized in RouteShorthandOptions
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(fastify as any).get(
    "/ws/:playerId",
    { websocket: true, schema: schema },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async (socket: any, req: FastifyRequest<WebSocketParams>) => {
      const { playerId } = req.params
      const { data, info, signature } = req.query

      try {
        // Parse the signed request from query params
        const signedRequest: SignedRequest<unknown> = {
          data: JSON.parse(decodeURIComponent(data)),
          info: JSON.parse(decodeURIComponent(info)) as SignedRequestInfo,
          signature: signature as Hex
        }

        // Verify the signature and get the verified player ID
        const verifiedPlayerId = await verifyRequest(signedRequest)

        // Ensure the playerId in the URL matches the verified address
        if (playerId.toLowerCase() !== verifiedPlayerId.toLowerCase()) {
          throw new PlayerIdMismatchError(
            `URL playerId ${playerId} does not match verified address ${verifiedPlayerId}`
          )
        }

        // Clean up any existing connection for this playerId
        const existingConnection = wsConnections.get(playerId)
        if (existingConnection) {
          try {
            existingConnection.close()
          } catch (e) {
            console.error("Error closing existing connection:", e)
          }
          wsConnections.delete(playerId)
        }

        // Store the new WebSocket connection
        wsConnections.set(playerId, socket as unknown as WebSocket)

        // Broadcast updated client list to all connected clients
        broadcast({
          id: uuidv4(),
          topic: "clients__update",
          message: getConnectedPlayerIds(),
          timestamp: Date.now()
        })

        socket.on("close", () => {
          wsConnections.delete(playerId)
          // Broadcast updated client list to all connected clients
          broadcast({
            id: uuidv4(),
            topic: "clients__update",
            message: getConnectedPlayerIds(),
            timestamp: Date.now()
          })
        })

        socket.on("error", (error: Error) => {
          console.error(`WebSocket error for player ${playerId}:`, error)
          wsConnections.delete(playerId)
        })
      } catch (error) {
        console.error("Connection authentication failed:", error)
        // Close the socket with an error code
        socket.close(4001, error instanceof Error ? error.message : "Authentication failed")
      }
    }
  )
}

export default routes
