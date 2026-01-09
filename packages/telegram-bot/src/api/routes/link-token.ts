import { Router, type IRouter } from "express"
import { generateLinkToken } from "../../utils/crypto.js"
import { createLinkToken, cleanupExpiredTokens } from "../../storage/sessions.js"
import { getEnv } from "../../utils/env.js"

export const linkTokenRoute: IRouter = Router()

/**
 * GET /api/link/token
 * Generate a new link token for a Telegram user
 */
linkTokenRoute.get("/token", (req, res) => {
  try {
    const telegramUserId = parseInt(req.query.telegramUserId as string, 10)

    if (isNaN(telegramUserId)) {
      res.status(400).json({
        success: false,
        error: "Invalid telegramUserId"
      })
      return
    }

    // Clean up expired tokens periodically
    cleanupExpiredTokens()

    // Generate new token
    const token = generateLinkToken()
    createLinkToken(telegramUserId, token)

    // Build the linking URL
    const env = getEnv()
    const url = `${env.API_URL}/telegram/link?token=${token}&tgUserId=${telegramUserId}`

    res.json({
      success: true,
      url
    })
  } catch (error) {
    console.error("Error generating link token:", error)
    res.status(500).json({
      success: false,
      error: "Failed to generate link token"
    })
  }
})

/**
 * POST /api/link/token
 * Alternative endpoint for generating token with body
 */
linkTokenRoute.post("/token", (req, res) => {
  try {
    const { telegramUserId } = req.body

    if (!telegramUserId || typeof telegramUserId !== "number") {
      res.status(400).json({
        success: false,
        error: "Invalid telegramUserId"
      })
      return
    }

    // Clean up expired tokens periodically
    cleanupExpiredTokens()

    // Generate new token
    const token = generateLinkToken()
    createLinkToken(telegramUserId, token)

    // Build the linking URL
    const env = getEnv()
    const url = `${env.API_URL}/telegram/link?token=${token}&tgUserId=${telegramUserId}`

    res.json({
      success: true,
      url
    })
  } catch (error) {
    console.error("Error generating link token:", error)
    res.status(500).json({
      success: false,
      error: "Failed to generate link token"
    })
  }
})
