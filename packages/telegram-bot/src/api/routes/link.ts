import { Router, type IRouter } from "express"
import type { Address, Hex } from "viem"
import { verifyMessage } from "viem"
import { getLinkToken, markTokenUsed, storeLinkedUser } from "../../storage/sessions.js"
import { deriveEncryptionKey, decrypt } from "../../utils/crypto.js"

export const linkRoute: IRouter = Router()

/**
 * POST /api/link
 * Receive encrypted session key from the browser
 */
linkRoute.post("/", async (req, res) => {
  try {
    const { token, encryptedSessionKey, walletAddress, signature } = req.body as {
      token: string
      encryptedSessionKey: string
      walletAddress: Address
      signature: Hex
    }

    // Validate required fields
    if (!token || !encryptedSessionKey || !walletAddress || !signature) {
      res.status(400).json({
        success: false,
        error: "Missing required fields"
      })
      return
    }

    // Validate token
    const linkToken = getLinkToken(token)
    if (!linkToken) {
      res.status(400).json({
        success: false,
        error: "Invalid token"
      })
      return
    }

    // Check if token is expired
    if (new Date() > linkToken.expiresAt) {
      res.status(400).json({
        success: false,
        error: "Token expired"
      })
      return
    }

    // Check if token was already used
    if (linkToken.used) {
      res.status(400).json({
        success: false,
        error: "Token already used"
      })
      return
    }

    // Verify the signature proves wallet ownership
    // The message signed is the token itself
    const isValidSignature = await verifyMessage({
      address: walletAddress,
      message: token,
      signature
    })

    if (!isValidSignature) {
      res.status(400).json({
        success: false,
        error: "Invalid signature"
      })
      return
    }

    // Derive encryption key from token + signature
    const encryptionKey = deriveEncryptionKey(token, signature)

    // Decrypt the session key
    let sessionKey: Hex
    try {
      sessionKey = decrypt(encryptedSessionKey, encryptionKey) as Hex
    } catch {
      res.status(400).json({
        success: false,
        error: "Failed to decrypt session key"
      })
      return
    }

    // Validate session key format (should be a hex private key)
    if (!sessionKey.startsWith("0x") || sessionKey.length !== 66) {
      res.status(400).json({
        success: false,
        error: "Invalid session key format"
      })
      return
    }

    // Mark token as used
    markTokenUsed(token)

    // Store the linked user with encrypted session key
    storeLinkedUser(linkToken.telegramUserId, walletAddress, sessionKey)

    res.json({
      success: true
    })
  } catch (error) {
    console.error("Error linking wallet:", error)
    res.status(500).json({
      success: false,
      error: "Failed to link wallet"
    })
  }
})
