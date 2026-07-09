#!/usr/bin/env node
/**
 * Regenerates data.js — the outcome snapshot embedded in the post-mortem widget.
 *
 * Fetches curated outcomes (plus their trip prompt and image) from the PUBLIC
 * Sanity CMS. No token needed; the dataset is publicly readable.
 *
 * Usage:
 *   node build-data.mjs                 # uses the curated ID list below
 *   node build-data.mjs <id> <id> ...   # explicit outcome document IDs
 */

import { createHash } from "crypto"

const SANITY_URL = "https://saljmqwt.api.sanity.io/v2025-04-18/data/query/production"

// Curated examples for the post-mortem article, newest first.
// Comment lines describe why each one earns its place.
const CURATED_IDS = [
  // Intro: what a trip is, and how inventory changes what a rat can do
  "3af6195d-6c6b-4d47-862f-aaead52299b0", // Convenience store, empty-handed — puts the box back, leaves, nothing changes
  "bd70ad14-b3f7-42b6-aff2-e0e2197567e6", // Same store, carrying Fire Blessing — the item wants the matches, rat buys them
  "889050ce-f984-4d6d-8f70-6882bc4ee3dc", // Computer shop, rat carries a Pistol — politely takes the free device
  "fcac1cdc-bcde-4b63-9525-9d466bb75c84", // Same shop, same rat, same Pistol — this time robs the register

  "f0c27463-4295-48a4-bd73-81afabc41c47", // Rat Tinder — ASCII-art match, warehouse, death (trap)
  "1f7a11d8-7888-43c1-afef-655c8aa7b38e", // Rat Roulette Death Spin — instant -374, items lost (trap)
  "4cdffdaa-0b00-4760-abb4-babf364b7e6a", // Drip infusion — heal costs more than rat has, heart stops (pricing trap)
  "e6467880-d28d-4448-9e40-076e5ec39f7d", // DOOM E1M2 — Prescience carries the run, +5000 (big win)
  "1b66fe46-959e-44dc-b813-f7f0a249c8cf", // Train operator — makes the station, +247 (multi-trip economy arc)
  "5468bb2b-c46f-462c-9e59-6d8de668942e", // Pawn shop — sells Insomnia, Pocket Watch, Uniform (economy arc end)
  "ad933907-75f8-434e-9c84-184bd4e3e6c9", // Rat forge — two Prescience combined into Deep Prescience (crafting)
  "c76353ae-e0bc-43eb-8da7-d67aa1009b39", // Sleep is for the wicked — 72h awake, Exhaustion + Clarity (item drama)
  "1680f82c-6b12-402b-8d87-9309d27db58f", // SEC EDGAR — MACHINE ELF warns, rat pays anyway, Worthless Paper (scam)
  "8abb99ed-0e1c-49d4-a7b0-6c12dd54bff1", // Sacred Pool — "healing waters" drown the rat, 4 items lost (scam trap)

  // Cross-trip object chains (gain → use pairs, kept adjacent):
  "1875f349-a2cc-487c-aa8f-7664f0872149", // Heist_Rat_01 buys Cursed Pistol at the Cursed Weapons Emporium
  "052ffae3-4bd9-4d5a-be3f-a739b32f666c", // …then fires it during the CEO weapons-stash heist (+3200)
  "f7ee346f-7e0d-47cd-9fc1-c6d005a2dc27", // Omen_Swap wins a Brick from a gacha machine
  "b8ac7fb3-552b-4674-9994-5a35da87384e", // …then presents the Brick at Construction Site Blessings for coins
  "0afbf88b-8992-486e-ae32-ae889a8b875d", // Netrunner_01 prints the Subsurface Facility Map in an office-drudgery trip
  "712ff643-01fe-4811-80bb-d152a5811b41", // …then the map opens the armory black site (but can't afford the EMP cannon)
  "897619ad-1256-48f4-ab59-db1e38b1039f", // Lil_Buddy_175 buys a Pistol off a pedestal in a name-gated trip
  "bed7cee1-79e6-4a76-a9f8-76f41e5a45a2" // …then empties it into 5 rabid XL bullies; Flaming Blade finishes the job
]

const ids = process.argv.slice(2).length > 0 ? process.argv.slice(2) : CURATED_IDS

const PROJECTION = `{
  _id, _createdAt, ratId, ratName, playerName, tripId,
  ratValueChange, oldRatBalance, newRatBalance,
  oldRatValue, ratValue,
  log[]{timestamp, event},
  balanceTransfers[]{logStep, amount},
  itemChanges[]{logStep, type, name, value},
  itemsLostOnDeath[]{name, value},
  inventoryOnEntrance[]{name, value},
  "trip": *[_type=="trip" && _id == ^.tripId][0]{
    title, prompt, ownerName,
    "imageUrl": image.asset->url
  }
}`

// Rat avatars are 4 layered part images (body, arms, head, ears), picked from the
// "rat-images" singleton by hashing the rat's entity ID — same scheme as the
// client's RatAvatar.svelte + hashToIndices in @ratfun/shared-utils.
const RAT_IMAGES_QUERY = `*[_id == "rat-images"][0]{
  "bodies": ratBodies[].asset->url,
  "arms": ratArms[].asset->url,
  "heads": ratHeads[].asset->url,
  "ears": ratEars[].asset->url
}`

// Ported verbatim from packages/shared-utils/src/index.ts (hexToFourParts /
// hashToIndices). parseInt on 16 hex chars loses precision past 2^53, but the
// game runs the same JS, so the resulting indices match exactly.
function hexToFourParts(hexString) {
  const cleanHex = hexString.startsWith("0x") ? hexString.slice(2) : hexString
  const partLength = 16
  return [
    parseInt(cleanHex.slice(0, partLength), 16),
    parseInt(cleanHex.slice(partLength, partLength * 2), 16),
    parseInt(cleanHex.slice(partLength * 2, partLength * 3), 16),
    parseInt(cleanHex.slice(partLength * 3, partLength * 4), 16)
  ]
}

function hashToIndices(addressHash, lengths) {
  const parts = hexToFourParts(addressHash)
  return [
    parts[0] % lengths[0],
    parts[1] % lengths[1],
    parts[2] % lengths[2],
    parts[3] % lengths[3]
  ]
}

// viem's sha256(Hex) hashes the decoded bytes, not the string
function ratAvatarUrls(ratId, parts) {
  if (!ratId || !parts) return null
  const hash =
    "0x" +
    createHash("sha256")
      .update(Buffer.from(ratId.slice(2), "hex"))
      .digest("hex")
  const indices = hashToIndices(hash, [
    parts.bodies.length,
    parts.arms.length,
    parts.heads.length,
    parts.ears.length
  ])
  return [
    parts.bodies[indices[0]],
    parts.arms[indices[1]],
    parts.heads[indices[2]],
    parts.ears[indices[3]]
  ].map(u => u + "?w=360")
}

const groq = `*[_type=="outcome" && _id in $ids] ${PROJECTION}`
const url = `${SANITY_URL}?query=${encodeURIComponent(groq)}&$ids=${encodeURIComponent(JSON.stringify(ids))}`

const res = await fetch(url)
const json = await res.json()
if (json.error) {
  console.error("Sanity query failed:", JSON.stringify(json.error, null, 2))
  process.exit(1)
}

const partsRes = await fetch(`${SANITY_URL}?query=${encodeURIComponent(RAT_IMAGES_QUERY)}`)
const partsJson = await partsRes.json()
if (partsJson.error) {
  console.error("rat-images query failed:", JSON.stringify(partsJson.error, null, 2))
  process.exit(1)
}
const ratParts = partsJson.result

// Preserve the curated order
const byId = Object.fromEntries(json.result.map(o => [o._id, o]))
const outcomes = ids.map(id => byId[id]).filter(Boolean)

for (const outcome of outcomes) {
  outcome.ratAvatar = ratAvatarUrls(outcome.ratId, ratParts)
}

const missing = ids.filter(id => !byId[id])
if (missing.length > 0) {
  console.error("Warning: outcomes not found:", missing.join(", "))
}

const { writeFileSync, mkdirSync, existsSync } = await import("fs")
const { fileURLToPath } = await import("url")
const { dirname, join } = await import("path")
const dir = dirname(fileURLToPath(import.meta.url))
const assetsDir = join(dir, "assets")
mkdirSync(assetsDir, { recursive: true })

// ── Vendor images ────────────────────────────────────────────────────────────
// Download every referenced CDN image into assets/ and rewrite the URLs in the
// snapshot to relative paths, so the deployed widget has no runtime dependency
// on cdn.sanity.io. Filenames keep the CDN basename, prefixed with the
// transform so different crops of the same asset can't collide.

async function vendorImage(url) {
  const [base, query] = url.split("?")
  const params = new URLSearchParams(query || "")
  const prefix = params.get("w") ? `w${params.get("w")}-` : ""
  const filename = prefix + base.split("/").pop()
  const localPath = join(assetsDir, filename)
  if (!existsSync(localPath)) {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`Failed to download ${url}: ${res.status}`)
    writeFileSync(localPath, Buffer.from(await res.arrayBuffer()))
  }
  return `assets/${filename}`
}

let imageCount = 0
for (const outcome of outcomes) {
  if (outcome.trip?.imageUrl?.startsWith("http")) {
    outcome.trip.imageUrl = await vendorImage(outcome.trip.imageUrl + "?w=240&h=240&fit=crop")
    imageCount++
  }
  if (outcome.ratAvatar) {
    outcome.ratAvatar = await Promise.all(
      outcome.ratAvatar.map(async u => {
        imageCount++
        return u.startsWith("http") ? vendorImage(u) : u
      })
    )
  }
}
console.log(`Vendored ${imageCount} image references into assets/`)

// ── Vendor fonts ─────────────────────────────────────────────────────────────
// Self-host Workbench and Xanh Mono (both OFL-licensed). The css2 API returns
// woff2 sources when asked with a modern browser user agent.

const FONT_CSS_URL = "https://fonts.googleapis.com/css2?family=Workbench&family=Xanh+Mono&display=swap"
const fontsCssPath = join(assetsDir, "fonts.css")
if (!existsSync(fontsCssPath)) {
  const cssRes = await fetch(FONT_CSS_URL, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36"
    }
  })
  let css = await cssRes.text()
  const fontUrls = [...new Set(css.match(/https:\/\/fonts\.gstatic\.com\/[^)]+/g) || [])]
  for (const fontUrl of fontUrls) {
    const filename = fontUrl.split("/").slice(-2).join("-")
    const res = await fetch(fontUrl)
    if (!res.ok) throw new Error(`Failed to download ${fontUrl}: ${res.status}`)
    writeFileSync(join(assetsDir, filename), Buffer.from(await res.arrayBuffer()))
    css = css.replaceAll(fontUrl, filename)
  }
  writeFileSync(fontsCssPath, css)
  console.log(`Vendored ${fontUrls.length} font files into assets/`)
} else {
  console.log("assets/fonts.css already present, skipping font download")
}

// ── Write snapshot ───────────────────────────────────────────────────────────
const banner = `// Generated by build-data.mjs on ${new Date().toISOString()} — do not edit by hand.\n`
const body = `window.OUTCOME_DATA = ${JSON.stringify(outcomes, null, 2)}\n`
writeFileSync(join(dir, "data.js"), banner + body)

console.log(`Wrote ${outcomes.length} outcomes to data.js`)

// ── Write human-readable reference (outcomes.txt) ────────────────────────────
// Article-quotable format; not used by the embeds.

function stripTags(text) {
  return text.replace(/\[\/?[A-Z]+\]/g, "")
}

const lines = []
for (const o of outcomes) {
  lines.push("=".repeat(72))
  lines.push(`TRIP: ${(o.trip?.prompt || "(unknown)").trim().replace(/\s*\n\s*/g, " / ")}`)
  lines.push("")
  const inv = (o.inventoryOnEntrance || []).map(i => i.name).join(", ")
  lines.push(`RAT: ${o.ratName} — ${inv || "No inventory"}`)
  lines.push("")
  for (let i = 0; i < (o.log || []).length; i++) {
    const entry = o.log[i]
    const markers = []
    for (const t of (o.balanceTransfers || []).filter(bT => bT.logStep === i && bT.amount !== 0)) {
      markers.push(`[♥${t.amount > 0 ? "+" : ""}${t.amount}]`)
    }
    for (const c of (o.itemChanges || []).filter(iC => iC.logStep === i)) {
      markers.push(`[${c.type === "remove" ? "-" : "+"}${c.name}]`)
    }
    const suffix = markers.length > 0 ? `  ${markers.join(" ")}` : ""
    lines.push(`    ${entry.timestamp}  ${stripTags(entry.event).replace(/\n/g, "\n           ")}${suffix}`)
  }
  lines.push("")
  const died = o.newRatBalance === 0
  const change = o.ratValueChange || 0
  const result = [
    died ? "RAT DIED" : null,
    `health ${o.oldRatBalance} -> ${o.newRatBalance}`,
    `value ${change >= 0 ? "+" : ""}${change} $RAT`,
    o.itemsLostOnDeath?.length ? `lost on death: ${o.itemsLostOnDeath.map(i => i.name).join(", ")}` : null
  ]
    .filter(Boolean)
    .join(" · ")
  lines.push(`RESULT: ${result}`)
  lines.push(`(${o.ratName} · sent by ${o.playerName} · ${o._createdAt.slice(0, 10)} · id ${o._id})`)
  lines.push("")
}
writeFileSync(join(dir, "outcomes.txt"), lines.join("\n"))
console.log(`Wrote outcomes.txt (${outcomes.length} outcomes, human-readable)`)
