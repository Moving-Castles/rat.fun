import type { FastifyInstance, FastifyRequest } from "fastify"
import { Hex } from "viem"
import { v4 as uuidv4 } from "uuid"

import { schema } from "@routes/ws-connect/schema"
import {
  broadcast,
  wsConnections,
  getConnectedPlayerIds,
  sendToClient,
  getPlayerName,
  setPlayerName
} from "@modules/websocket"
import { verifyRequest } from "@modules/signature"
import {
  AppError,
  PlayerIdMismatchError,
  RateLimitError,
  ValidationError
} from "@modules/error-handling/errors"
import { chatStore, rateLimiter, sanitizeContent, validateContent } from "@modules/chat"

import type {
  WebSocketParams,
  SignedRequest,
  SignedRequestInfo,
  ChatBroadcastMessage
} from "@modules/types"

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

        // Send chat history to the newly connected client
        const chatHistory = chatStore.getRecentMessages(20)
        if (chatHistory.length > 0) {
          sendToClient(playerId, {
            id: uuidv4(),
            topic: "chat__history",
            messages: chatHistory,
            timestamp: Date.now()
          })
        }

        // Broadcast updated client list to all connected clients
        broadcast({
          id: uuidv4(),
          topic: "clients__update",
          message: getConnectedPlayerIds(),
          timestamp: Date.now()
        })

        // Handle incoming messages from client
        socket.on("message", async (rawData: Buffer | string) => {
          try {
            const data = JSON.parse(rawData.toString())

            if (data.topic === "chat__send") {
              // Check rate limit
              if (!rateLimiter.canSend(playerId)) {
                const remaining = rateLimiter.getRemainingCooldown(playerId)
                throw new RateLimitError(`Rate limited. Try again in ${remaining}ms`)
              }

              // Validate content
              const validationError = validateContent(data.content)
              if (validationError) {
                throw new ValidationError(validationError)
              }

              // Verify signature if provided
              if (data.info && data.signature) {
                const signedRequest: SignedRequest<{ content: string }> = {
                  data: { content: data.content },
                  info: data.info as SignedRequestInfo,
                  signature: data.signature as Hex
                }

                const verifiedPlayerId = await verifyRequest(signedRequest)

                // Verify sender matches connection
                if (verifiedPlayerId.toLowerCase() !== playerId.toLowerCase()) {
                  throw new PlayerIdMismatchError(
                    `Message sender ${verifiedPlayerId} does not match connection ${playerId}`
                  )
                }
              }

              // Record rate limit
              rateLimiter.recordMessage(playerId)

              // Create chat message
              const chatMessage: ChatBroadcastMessage = {
                id: uuidv4(),
                topic: "chat__message",
                playerId: playerId,
                playerName: getPlayerName(playerId),
                content: sanitizeContent(data.content),
                timestamp: Date.now()
              }

              // Store message
              chatStore.addMessage(chatMessage)

              // Broadcast to all clients
              broadcast(chatMessage)
            } else if (data.topic === "player__name") {
              // Allow clients to update their display name
              if (typeof data.name === "string" && data.name.trim().length > 0) {
                setPlayerName(playerId, data.name.trim().slice(0, 32))
              }
            }
          } catch (error) {
            console.error(`Error handling message from ${playerId}:`, error)
            // Send error back to sender only
            sendToClient(playerId, {
              topic: "error",
              code: error instanceof AppError ? error.code : "UNKNOWN_ERROR",
              message: error instanceof Error ? error.message : "Unknown error",
              timestamp: Date.now()
            })
          }
        })

        socket.on("close", () => {
          wsConnections.delete(playerId)
          rateLimiter.clearPlayer(playerId)
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
          rateLimiter.clearPlayer(playerId)
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
