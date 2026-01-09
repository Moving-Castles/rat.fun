<script lang="ts">
  import { onMount } from "svelte"
  import { page } from "$app/stores"
  import { getDrawbridge } from "$lib/modules/drawbridge"

  type LinkState = "loading" | "not_logged_in" | "ready" | "linking" | "success" | "error"

  let state: LinkState = $state("loading")
  let errorMessage = $state("")
  let token = $state("")
  let tgUserId = $state("")

  // Bot API URL - should be configurable
  const BOT_API_URL = import.meta.env.VITE_TELEGRAM_BOT_API_URL || "https://telegram-bot.rat.fun"

  onMount(async () => {
    // Get params from URL
    token = $page.url.searchParams.get("token") || ""
    tgUserId = $page.url.searchParams.get("tgUserId") || ""

    if (!token || !tgUserId) {
      state = "error"
      errorMessage = "Missing token or Telegram user ID in URL. Please try /link again in Telegram."
      return
    }

    // Check if user is logged in
    try {
      const drawbridge = getDrawbridge()

      if (drawbridge.state !== "READY") {
        state = "not_logged_in"
        return
      }

      state = "ready"
    } catch {
      state = "not_logged_in"
    }
  })

  async function handleLink() {
    state = "linking"
    errorMessage = ""

    try {
      const drawbridge = getDrawbridge()

      if (drawbridge.state !== "READY") {
        throw new Error("Wallet not connected")
      }

      const walletAddress = drawbridge.userAddress
      if (!walletAddress) {
        throw new Error("No wallet address")
      }

      // Get session key from localStorage
      const sessionStorageKey = "drawbridge:session-signers"
      const stored = localStorage.getItem(sessionStorageKey)
      if (!stored) {
        throw new Error("No session key found. Please reconnect your wallet on rat.fun first.")
      }

      const sessionStore = JSON.parse(stored)
      const sessionKey = sessionStore.signers?.[walletAddress.toLowerCase()]
      if (!sessionKey) {
        throw new Error("No session key for your wallet. Please reconnect your wallet on rat.fun first.")
      }

      // Sign the token to prove wallet ownership
      const signature = await drawbridge.signMessage(token)

      // Derive encryption key from token + signature
      const encoder = new TextEncoder()
      const data = encoder.encode(`${token}:${signature}`)
      const hashBuffer = await crypto.subtle.digest("SHA-256", data)
      const encryptionKey = new Uint8Array(hashBuffer)

      // Encrypt the session key using AES-256-GCM
      const iv = crypto.getRandomValues(new Uint8Array(12))
      const cryptoKey = await crypto.subtle.importKey(
        "raw",
        encryptionKey,
        { name: "AES-GCM" },
        false,
        ["encrypt"]
      )

      const sessionKeyBytes = encoder.encode(sessionKey)
      const encryptedBytes = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        cryptoKey,
        sessionKeyBytes
      )

      // Combine iv + authTag + encrypted as hex
      const encrypted = new Uint8Array(encryptedBytes)
      const combined = new Uint8Array(iv.length + encrypted.length)
      combined.set(iv, 0)
      combined.set(encrypted, iv.length)
      const encryptedHex = Array.from(combined)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("")

      // Send to bot API
      const response = await fetch(`${BOT_API_URL}/api/link`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          encryptedSessionKey: encryptedHex,
          walletAddress,
          signature
        })
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || "Failed to link wallet")
      }

      state = "success"
    } catch (err) {
      state = "error"
      errorMessage = err instanceof Error ? err.message : "Unknown error"
    }
  }
</script>

<svelte:head>
  <title>Link to Telegram | rat.fun</title>
</svelte:head>

<div class="container">
  <div class="card">
    <h1>Link to Telegram</h1>

    {#if state === "loading"}
      <p>Loading...</p>
    {:else if state === "not_logged_in"}
      <p>You need to be logged in to rat.fun to link your wallet.</p>
      <p>Please <a href="/">go to the main page</a> and connect your wallet first.</p>
    {:else if state === "ready"}
      <p>Ready to link your wallet to Telegram.</p>
      <p>This will allow you to play rat.fun through the Telegram bot.</p>
      <button onclick={handleLink}>Link Wallet</button>
    {:else if state === "linking"}
      <p>Linking your wallet...</p>
      <p>Please sign the message in your wallet.</p>
    {:else if state === "success"}
      <div class="success">
        <h2>Success!</h2>
        <p>Your wallet is now linked to Telegram.</p>
        <p>You can close this page and return to the Telegram bot.</p>
      </div>
    {:else if state === "error"}
      <div class="error">
        <h2>Error</h2>
        <p>{errorMessage}</p>
        <button onclick={() => (state = "ready")}>Try Again</button>
      </div>
    {/if}
  </div>
</div>

<style>
  .container {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
    background: #0a0a0a;
    color: #fff;
  }

  .card {
    max-width: 400px;
    padding: 2rem;
    background: #1a1a1a;
    border-radius: 8px;
    text-align: center;
  }

  h1 {
    margin-bottom: 1.5rem;
    font-size: 1.5rem;
  }

  p {
    margin-bottom: 1rem;
    color: #aaa;
  }

  a {
    color: #4a9eff;
  }

  button {
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
    background: #4a9eff;
    color: #fff;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }

  button:hover {
    background: #3a8eef;
  }

  .success {
    color: #4ade80;
  }

  .success h2 {
    color: #4ade80;
  }

  .error {
    color: #f87171;
  }

  .error h2 {
    color: #f87171;
  }
</style>
