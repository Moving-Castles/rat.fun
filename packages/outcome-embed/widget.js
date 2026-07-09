// Shared rendering for the rat.fun outcome widgets (index.html gallery, solo.html).
// Log parsing/merging is ported from the client's GameRun components:
//   mergeLog      — GameRun/TripReport/Log/index.ts
//   parseLogText  — GameRun/TripReport/Log/LogItem/parseLogText.ts

const CURRENCY_SYMBOL = "$RAT"
const HEALTH_SYMBOL = "♥"
const KNOWN_TAGS = ["ITEM", "QUOTE", "SYSTEM", "BALANCE"]
const TAG_CLASS_MAP = {
  ITEM: "item-ref",
  QUOTE: "quote",
  SYSTEM: "system-message",
  BALANCE: "balance-message"
}

function processNestedContent(outerTag, content, knownTags) {
  const innerTagRegex = /\[([A-Z]+)\](.*?)\[\/\1\]/g
  const segments = []
  let currentIndex = 0
  let match
  while ((match = innerTagRegex.exec(content)) !== null) {
    const innerTagName = match[1]
    const innerContent = match[2]
    if (match.index > currentIndex) {
      segments.push({ type: outerTag, text: content.substring(currentIndex, match.index) })
    }
    if (innerTagName === "BALANCE" && outerTag === "QUOTE" && knownTags.includes("BALANCE")) {
      segments.push({ type: "BALANCE", text: innerContent })
    } else {
      segments.push({ type: outerTag, text: innerContent })
    }
    currentIndex = match.index + match[0].length
  }
  if (currentIndex < content.length) {
    segments.push({ type: outerTag, text: content.substring(currentIndex) })
  }
  if (segments.length === 0) {
    segments.push({ type: outerTag, text: content })
  }
  return segments
}

function parseLogText(text, knownTags) {
  const segments = []
  let currentIndex = 0
  const regex = /\[([A-Z]+)\](.*?)\[\/\1\]/gs
  let match
  while ((match = regex.exec(text)) !== null) {
    if (match.index > currentIndex) {
      segments.push({ type: "plain", text: text.substring(currentIndex, match.index) })
    }
    const tagName = match[1]
    const content = match[2]
    if (knownTags.includes(tagName)) {
      segments.push(...processNestedContent(tagName, content, knownTags))
    } else {
      segments.push({ type: "plain", text: match[0] })
    }
    currentIndex = match.index + match[0].length
  }
  if (currentIndex < text.length) {
    segments.push({ type: "plain", text: text.substring(currentIndex) })
  }
  return segments
}

function mergeLog(outcome) {
  const mergedLog = JSON.parse(JSON.stringify(outcome.log || []))
  for (let i = 0; i < mergedLog.length; i++) {
    const transfers = (outcome.balanceTransfers || []).filter(
      bT => bT.logStep === i && bT.amount !== 0
    )
    if (transfers.length > 0) {
      const totalAmount = transfers.reduce((sum, t) => sum + t.amount, 0)
      mergedLog[i].balanceTransfer = { logStep: i, amount: totalAmount }
    }
    const itemChanges = (outcome.itemChanges || [])
      .filter(iC => iC.logStep === i)
      .sort((a, b) => {
        if (a.type === "remove" && b.type === "add") return -1
        if (a.type === "add" && b.type === "remove") return 1
        return 0
      })
    if (itemChanges.length > 0) {
      mergedLog[i].itemChanges = itemChanges
    }
  }
  return mergedLog
}

function el(tag, className, text) {
  const node = document.createElement(tag)
  if (className) node.className = className
  if (text !== undefined) node.textContent = text
  return node
}

function renderLogText(text) {
  const container = el("div", "log-text")
  for (const segment of parseLogText(text, KNOWN_TAGS)) {
    const span = el("span", segment.type === "plain" ? "" : TAG_CLASS_MAP[segment.type])
    span.textContent = segment.text
    container.appendChild(span)
  }
  return container
}

function renderItemChip(name, value, action) {
  const negative = action === "remove"
  const chip = el("div", "outcome" + (negative ? " negative" : ""))
  chip.textContent = `${name} (${negative ? "-" : ""}${value} ${CURRENCY_SYMBOL})`
  return chip
}

function renderHealthChip(value) {
  const chip = el("div", "outcome" + (value < 0 ? " negative" : ""))
  chip.appendChild(el("span", "heart", HEALTH_SYMBOL))
  chip.appendChild(el("span", "", value > 0 ? `+${value}` : `${value}`))
  return chip
}

let revealTimers = []
let revealObserver = null

function clearTimers() {
  revealTimers.forEach(clearTimeout)
  revealTimers = []
  if (revealObserver) {
    revealObserver.disconnect()
    revealObserver = null
  }
}

// Run `start` once the target scrolls into view. Works inside iframes:
// with no explicit root, IntersectionObserver reports intersection with the
// top-level viewport, so the animation waits for the embed to be seen.
function startWhenVisible(target, start) {
  if (!("IntersectionObserver" in window)) {
    start()
    return
  }
  revealObserver = new IntersectionObserver(
    entries => {
      if (entries.some(e => e.isIntersecting)) {
        revealObserver.disconnect()
        revealObserver = null
        start()
      }
    },
    { threshold: 0.2 }
  )
  revealObserver.observe(target)
}

/**
 * Render one outcome into the given elements.
 * els: { header, logContainer, resultStrip, ratSlot }
 */
function renderOutcome(outcome, els, animate = true) {
  clearTimers()
  const { header, logContainer, resultStrip, ratSlot } = els
  header.innerHTML = ""
  logContainer.innerHTML = ""
  resultStrip.innerHTML = ""
  resultStrip.classList.remove("visible")
  if (ratSlot) ratSlot.innerHTML = ""

  // ── Header
  const trip = outcome.trip || {}
  if (trip.imageUrl) {
    const img = el("img", "trip-image")
    // Vendored snapshots use relative paths; only remote CDN URLs get a transform
    img.src = trip.imageUrl.startsWith("http")
      ? trip.imageUrl + "?w=240&h=240&fit=crop"
      : trip.imageUrl
    img.alt = ""
    header.appendChild(img)
  }
  const meta = el("div", "trip-meta")
  meta.appendChild(el("div", "trip-label", "TRIP PROMPT"))
  meta.appendChild(el("div", "trip-prompt", trip.prompt || "(unknown trip)"))
  const date = new Date(outcome._createdAt).toISOString().slice(0, 10)
  meta.appendChild(el("div", "run-meta", `sent by ${outcome.playerName} · ${date}`))
  header.appendChild(meta)

  // Rat panel in the bottom bar: 4 stacked part layers (body, arms, head,
  // ears), same composition as the game's RatAvatar.svelte, with info beside
  const died = outcome.newRatBalance === 0
  let avatar = null
  let ratInfo = null
  if (ratSlot) {
    const ratBox = el("div", "rat-box")
    if (outcome.ratAvatar && outcome.ratAvatar.length === 4) {
      avatar = el("div", "rat-avatar" + (died ? " dead" : ""))
      const layerNames = ["body", "arms", "head", "ears"]
      outcome.ratAvatar.forEach((src, i) => {
        const layer = el("div", "layer " + layerNames[i])
        const img = el("img")
        img.src = src
        img.alt = ""
        img.draggable = false
        layer.appendChild(img)
        avatar.appendChild(layer)
      })
      ratBox.appendChild(avatar)
    }
    ratInfo = el("div", "rat-info")
    ratInfo.appendChild(el("div", "rat-chip" + (died ? " dead" : ""), outcome.ratName))
    ratBox.appendChild(ratInfo)
    ratSlot.appendChild(ratBox)
  }

  // ── Inventory on entrance
  const revealables = []
  if (outcome.inventoryOnEntrance && outcome.inventoryOnEntrance.length > 0) {
    const section = el("div", "inventory-section")
    section.appendChild(el("div", "inventory-label", "Started with:"))
    const items = el("div", "inventory-items")
    for (const item of outcome.inventoryOnEntrance) {
      items.appendChild(renderItemChip(item.name || "Unknown", item.value || 0, "add"))
    }
    section.appendChild(items)
    logContainer.appendChild(section)
  }

  // ── Log entries
  for (const entry of mergeLog(outcome)) {
    const row = el("div", "log-item")
    row.appendChild(el("div", "timestamp", entry.timestamp))
    row.appendChild(renderLogText(entry.event))
    if (entry.balanceTransfer || entry.itemChanges) {
      const list = el("div", "outcome-list")
      if (entry.balanceTransfer) {
        list.appendChild(renderHealthChip(entry.balanceTransfer.amount))
      }
      for (const change of entry.itemChanges || []) {
        list.appendChild(renderItemChip(change.name, change.value, change.type))
      }
      row.appendChild(list)
    }
    logContainer.appendChild(row)
    revealables.push(row)
  }

  // ── Result strip
  if (died) {
    resultStrip.appendChild(el("div", "result-box dead", "RAT DIED"))
  }
  const healthBox = el("div", "result-box")
  healthBox.appendChild(el("span", "label", "health"))
  healthBox.appendChild(
    el(
      "span",
      "",
      `${outcome.oldRatBalance} ${HEALTH_SYMBOL} → ${outcome.newRatBalance} ${HEALTH_SYMBOL}`
    )
  )
  resultStrip.appendChild(healthBox)

  const change = outcome.ratValueChange || 0
  const valueBox = el("div", "result-box")
  valueBox.appendChild(el("span", "label", "total value change"))
  valueBox.appendChild(
    el(
      "span",
      change >= 0 ? "value-up" : "value-down",
      `${change >= 0 ? "+" : ""}${change} ${CURRENCY_SYMBOL}`
    )
  )
  resultStrip.appendChild(valueBox)

  if (outcome.itemsLostOnDeath && outcome.itemsLostOnDeath.length > 0) {
    const lostBox = el("div", "result-box")
    lostBox.appendChild(el("span", "label", "lost on death"))
    lostBox.appendChild(
      el("span", "value-down", outcome.itemsLostOnDeath.map(i => i.name).join(", "))
    )
    resultStrip.appendChild(lostBox)
  }

  // ── Staggered reveal (mirrors OutcomeLog.svelte timing: 0.2s + i * 0.05s,
  // slowed down a touch for article readers)
  // No auto-scroll: in a clipped iframe, following the reveal would leave the
  // reader at the bottom of the log — let them scroll at their own pace.
  const stepMs = animate ? 320 : 0
  const startReveal = () => {
    if (avatar) avatar.classList.add("revealed")
    if (ratInfo) ratInfo.classList.add("revealed")
    revealables.forEach((row, i) => {
      revealTimers.push(
        setTimeout(() => row.classList.add("visible"), animate ? 200 + i * stepMs : 0)
      )
    })
    revealTimers.push(
      setTimeout(
        () => resultStrip.classList.add("visible"),
        animate ? 200 + revealables.length * stepMs + 200 : 0
      )
    )
  }
  logContainer.scrollTop = 0

  // Hold the animation until the widget is actually seen
  if (animate) {
    startWhenVisible(logContainer, startReveal)
  } else {
    startReveal()
  }
}

window.RatWidget = { renderOutcome, el }
