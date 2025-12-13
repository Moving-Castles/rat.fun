# Operator Feed Implementation Plan

## Overview

Add a third main view called "Operator Feed" to the client application, accessible via the `.online-users` element in the top bar. This view combines a real-time activity feed with a leaderboard, providing a social layer for observing game activity.

## Feature Summary

- **Route**: `/operator-feed`
- **Toggle**: Click `.online-users` element in top bar
- **Layout**: Two-column (Feed | Stats), similar to main game view
- **Mobile**: Single column with SlideToggle to switch between Feed and Leaderboard
- **Feature Flag**: `ENABLE_LEADERBOARD` - when disabled, Feed takes full width

---

## Architecture Decisions

### Leaderboard Data Strategy

The current `initEntities.ts` filtering prevents loading global data needed for leaderboards (all rats, all players, etc.). Options considered:

| Option                            | Pros                                                      | Cons                                            |
| --------------------------------- | --------------------------------------------------------- | ----------------------------------------------- |
| **A. Hydration Server Endpoints** | Server-side aggregation, efficient, follows existing plan | Requires Phase 2 of postgresql-filtered-sync.md |
| **B. Separate Indexer Query**     | Independent of game sync                                  | Duplicates data loading, more complex           |
| **C. CMS-Based Leaderboard**      | Leverages existing Sanity infrastructure                  | Requires server/backend to update CMS           |
| **D. Dedicated Leaderboard API**  | Clean separation, cacheable                               | New service to maintain                         |

**Recommendation**: Option A (Hydration Server Endpoints) - Add leaderboard endpoints to the planned hydration server. For MVP, use the feature flag to deploy Feed-only first while leaderboard data loading is resolved.

### Chat Message Validation

Chat messages need validation to prevent impersonation:

1. Client signs message with wallet
2. WebSocket server verifies signature
3. Server broadcasts to all connected clients
4. Clients display with verified sender identity

---

## Implementation Phases

### Phase 1: Client Foundation

#### 1.1 Feature Flag & Configuration

**File**: `packages/client/src/lib/config/features.ts` (new)

```typescript
export const FEATURES = {
  ENABLE_LEADERBOARD: false // Set to true when data loading is ready
}
```

#### 1.2 Route Setup

**New Files**:

- `packages/client/src/routes/(main)/operator-feed/+layout.svelte`
- `packages/client/src/routes/(main)/operator-feed/+page.svelte`

The layout should mirror `(game)/+layout.svelte` structure:

- Two-column desktop layout with CenterBar
- Single-column mobile with SlideToggle
- Conditional full-width when leaderboard disabled

#### 1.3 OnlineUsers Navigation Update

**File**: `packages/client/src/lib/components/Shared/TopBar/OnlineUsers/OnlineUsers.svelte`

Modify to:

- Navigate to `/operator-feed` on click (instead of dropdown toggle)
- Add visual indicator when on operator-feed route
- Keep dropdown functionality accessible via right-click or long-press

#### 1.4 New Component Structure

```
packages/client/src/lib/components/OperatorFeed/
├── index.ts
├── OperatorFeed.svelte          # Main container
├── Feed/
│   ├── Feed.svelte              # Left column container
│   ├── FeedHeader.svelte        # Filter bar
│   ├── FeedMessages.svelte      # Message area
│   ├── FeedMessage.svelte       # Individual message
│   ├── ChatInput.svelte         # Input + send button
│   └── types.ts                 # Feed message types
├── Stats/
│   ├── Stats.svelte             # Right column container
│   ├── Leaderboard.svelte       # Leaderboard container
│   ├── LeaderboardEntry.svelte  # Individual entry
│   └── LeaderboardToggle.svelte # Alive/AllTime toggle
└── state.svelte.ts              # Feed state management
```

---

### Phase 2: Feed Implementation

#### 2.1 Feed Message Types

**File**: `packages/client/src/lib/components/OperatorFeed/Feed/types.ts`

```typescript
export enum FEED_MESSAGE_TYPE {
  CHAT = "chat",
  NEW_TRIP = "new_trip",
  NEW_OUTCOME = "new_outcome",
  PLAYER_JOINED = "player_joined"
}

export type BaseFeedMessage = {
  id: string
  timestamp: number
  type: FEED_MESSAGE_TYPE
}

export type ChatMessage = BaseFeedMessage & {
  type: FEED_MESSAGE_TYPE.CHAT
  playerId: string
  playerName: string
  content: string
}

export type NewTripMessage = BaseFeedMessage & {
  type: FEED_MESSAGE_TYPE.NEW_TRIP
  tripId: string
  tripTitle: string
  creatorName: string
}

export type NewOutcomeMessage = BaseFeedMessage & {
  type: FEED_MESSAGE_TYPE.NEW_OUTCOME
  tripId: string
  tripTitle: string
  ratName: string
  playerName: string
  result: "survived" | "died"
  valueChange: number
}

export type PlayerJoinedMessage = BaseFeedMessage & {
  type: FEED_MESSAGE_TYPE.PLAYER_JOINED
  playerId: string
  playerName: string
}

export type FeedMessage = ChatMessage | NewTripMessage | NewOutcomeMessage | PlayerJoinedMessage
```

#### 2.2 Feed State Management

**File**: `packages/client/src/lib/components/OperatorFeed/state.svelte.ts`

```typescript
import { writable, derived } from "svelte/store"
import type { FeedMessage, FEED_MESSAGE_TYPE } from "./Feed/types"

const MAX_MESSAGES = 200

export const feedMessages = writable<FeedMessage[]>([])
export const activeFilters = writable<Set<FEED_MESSAGE_TYPE>>(new Set())

export const filteredMessages = derived([feedMessages, activeFilters], ([$messages, $filters]) => {
  if ($filters.size === 0) return $messages
  return $messages.filter(m => $filters.has(m.type))
})

export function addFeedMessage(message: FeedMessage) {
  feedMessages.update(messages => {
    const updated = [...messages, message]
    // Trim to max messages
    if (updated.length > MAX_MESSAGES) {
      return updated.slice(-MAX_MESSAGES)
    }
    return updated
  })
}

export function toggleFilter(type: FEED_MESSAGE_TYPE) {
  activeFilters.update(filters => {
    const newFilters = new Set(filters)
    if (newFilters.has(type)) {
      newFilters.delete(type)
    } else {
      newFilters.add(type)
    }
    return newFilters
  })
}
```

#### 2.3 Feed Header Component

**File**: `packages/client/src/lib/components/OperatorFeed/Feed/FeedHeader.svelte`

Filter checkboxes for each message type (allows multi-select):

- Chat (checked by default)
- Trips (checked by default)
- Outcomes (checked by default)
- Players (checked by default)

All checkboxes checked = show all messages. Unchecking hides that type.
Style similar to existing filter patterns in the codebase.

#### 2.4 Feed Messages Component

**File**: `packages/client/src/lib/components/OperatorFeed/Feed/FeedMessages.svelte`

- Scrollable container
- Auto-scroll to bottom on new messages
- Pause auto-scroll if user scrolls up
- Resume auto-scroll when at bottom
- Use virtual scrolling if performance becomes an issue

#### 2.5 Chat Input Component

**File**: `packages/client/src/lib/components/OperatorFeed/Feed/ChatInput.svelte`

- Input field with max length (e.g., 280 chars)
- Send button
- Enter key to send
- Disabled state while sending
- Character counter (reuse existing CharacterCounter component)

---

### Phase 3: WebSocket Server Chat Support

#### 3.1 New Message Types

**File**: `packages/websocket-server/src/modules/types/index.ts`

Add new types:

```typescript
export type ChatMessagePayload = {
  content: string
  timestamp: number
}

export type ChatBroadcastMessage = {
  id: string
  topic: "chat__message"
  playerId: string
  playerName: string
  content: string
  timestamp: number
}

export type ChatHistoryMessage = {
  id: string
  topic: "chat__history"
  messages: ChatBroadcastMessage[]
  timestamp: number
}

export type ServerMessage = ClientsUpdateMessage | ChatBroadcastMessage | ChatHistoryMessage
```

#### 3.2 Chat Store Interface

**File**: `packages/websocket-server/src/modules/chat/store.ts` (new)

```typescript
// Interface to allow future extension to persistent storage
export interface ChatStore {
  addMessage(message: ChatBroadcastMessage): void
  getRecentMessages(limit: number): ChatBroadcastMessage[]
}

// In-memory implementation
class InMemoryChatStore implements ChatStore {
  private messages: ChatBroadcastMessage[] = []
  private maxMessages = 100 // Store more than we send to allow for some buffer

  addMessage(message: ChatBroadcastMessage): void {
    this.messages.push(message)
    if (this.messages.length > this.maxMessages) {
      this.messages = this.messages.slice(-this.maxMessages)
    }
  }

  getRecentMessages(limit: number = 20): ChatBroadcastMessage[] {
    return this.messages.slice(-limit)
  }
}

export const chatStore: ChatStore = new InMemoryChatStore()
```

#### 3.3 Rate Limiter

**File**: `packages/websocket-server/src/modules/chat/rate-limiter.ts` (new)

```typescript
const RATE_LIMIT_MS = 1000 // 1 message per second

class RateLimiter {
  private lastMessageTime: Map<string, number> = new Map()

  canSend(playerId: string): boolean {
    const now = Date.now()
    const lastTime = this.lastMessageTime.get(playerId) ?? 0
    return now - lastTime >= RATE_LIMIT_MS
  }

  recordMessage(playerId: string): void {
    this.lastMessageTime.set(playerId, Date.now())
  }

  getRemainingCooldown(playerId: string): number {
    const now = Date.now()
    const lastTime = this.lastMessageTime.get(playerId) ?? 0
    const elapsed = now - lastTime
    return Math.max(0, RATE_LIMIT_MS - elapsed)
  }
}

export const rateLimiter = new RateLimiter()
```

#### 3.4 Message Handler

**File**: `packages/websocket-server/src/routes/ws-connect/index.ts`

Add message handler to the WebSocket route:

```typescript
import { chatStore } from "../modules/chat/store"
import { rateLimiter } from "../modules/chat/rate-limiter"

// On successful connection, send chat history
const recentMessages = chatStore.getRecentMessages(20)
if (recentMessages.length > 0) {
  sendToClient(playerId, {
    id: uuidv4(),
    topic: "chat__history",
    messages: recentMessages,
    timestamp: Date.now()
  })
}

socket.on("message", async (rawData: Buffer | string) => {
  try {
    const data = JSON.parse(rawData.toString())

    if (data.topic === "chat__send") {
      // Check rate limit
      if (!rateLimiter.canSend(playerId)) {
        const remaining = rateLimiter.getRemainingCooldown(playerId)
        throw new RateLimitError(`Rate limited. Try again in ${remaining}ms`)
      }

      // Validate signed request
      const { content, info, signature } = data
      const verifiedPlayerId = await verifyRequest({ data: { content }, info, signature })

      // Verify sender matches connection
      if (verifiedPlayerId.toLowerCase() !== playerId.toLowerCase()) {
        throw new PlayerIdMismatchError(...)
      }

      // Validate content
      if (!content || typeof content !== "string" || content.length > 280) {
        throw new ValidationError("Invalid message content")
      }

      // Record rate limit
      rateLimiter.recordMessage(playerId)

      const chatMessage: ChatBroadcastMessage = {
        id: uuidv4(),
        topic: "chat__message",
        playerId: verifiedPlayerId,
        playerName: getPlayerName(verifiedPlayerId),
        content: sanitizeContent(content),
        timestamp: Date.now()
      }

      // Store message
      chatStore.addMessage(chatMessage)

      // Broadcast to all clients
      broadcast(chatMessage)
    }
  } catch (error) {
    // Send error back to sender only
    sendToClient(playerId, {
      topic: "error",
      message: error.message
    })
  }
})
```

#### 3.5 Content Sanitization

**File**: `packages/websocket-server/src/modules/chat/sanitize.ts` (new)

```typescript
export function sanitizeContent(content: string): string {
  // Trim whitespace
  let sanitized = content.trim()

  // Remove excessive whitespace
  sanitized = sanitized.replace(/\s+/g, " ")

  // Basic XSS prevention (client will also sanitize on render)
  sanitized = sanitized.replace(/</g, "&lt;").replace(/>/g, "&gt;")

  return sanitized
}
```

---

### Phase 4: Client WebSocket Integration

#### 4.1 Update Off-Chain Sync

**File**: `packages/client/src/lib/modules/off-chain-sync/index.ts`

Add chat message handling:

```typescript
// New message types
type ChatBroadcastMessage = {
  id: string
  topic: "chat__message"
  playerId: string
  playerName: string
  content: string
  timestamp: number
}

type ChatHistoryMessage = {
  id: string
  topic: "chat__history"
  messages: ChatBroadcastMessage[]
  timestamp: number
}

type ServerMessage = ClientsUpdateMessage | ChatBroadcastMessage | ChatHistoryMessage

// In socket.onmessage:

// Handle chat history (received on connection)
if (messageContent.topic === "chat__history") {
  const historyMessage = messageContent as ChatHistoryMessage
  for (const chatMessage of historyMessage.messages) {
    addFeedMessage({
      id: chatMessage.id,
      type: FEED_MESSAGE_TYPE.CHAT,
      timestamp: chatMessage.timestamp,
      playerId: chatMessage.playerId,
      playerName: chatMessage.playerName,
      content: chatMessage.content
    })
  }
}

// Handle new chat message
if (messageContent.topic === "chat__message") {
  const chatMessage = messageContent as ChatBroadcastMessage
  addFeedMessage({
    id: chatMessage.id,
    type: FEED_MESSAGE_TYPE.CHAT,
    timestamp: chatMessage.timestamp,
    playerId: chatMessage.playerId,
    playerName: chatMessage.playerName,
    content: chatMessage.content
  })
}
```

#### 4.2 Send Chat Message Function

**File**: `packages/client/src/lib/modules/off-chain-sync/chat.ts` (new)

```typescript
import { signRequest } from "$lib/modules/signature"

let socket: WebSocket | null = null

export function setSocket(ws: WebSocket | null) {
  socket = ws
}

export async function sendChatMessage(content: string): Promise<void> {
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    throw new Error("Not connected to server")
  }

  const signedRequest = await signRequest({
    topic: "chat__send",
    content: content.trim()
  })

  socket.send(
    JSON.stringify({
      topic: "chat__send",
      content: signedRequest.data.content,
      info: signedRequest.info,
      signature: signedRequest.signature
    })
  )
}
```

---

### Phase 5: Feed Event Integration

#### 5.1 New Trip Events

**File**: `packages/client/src/lib/modules/content/new-trip-notifications.ts`

Modify to also publish to feed:

```typescript
import { addFeedMessage } from "$lib/components/OperatorFeed/state.svelte"
import { FEED_MESSAGE_TYPE } from "$lib/components/OperatorFeed/Feed/types"

// In handleNewTrip():
addFeedMessage({
  id: `trip-${trip._id}-${Date.now()}`,
  type: FEED_MESSAGE_TYPE.NEW_TRIP,
  timestamp: Date.now(),
  tripId: trip._id,
  tripTitle: trip.title || `Trip #${trip.tripIndex}`,
  creatorName: trip.ownerName || shortenAddress(trip.owner)
})
```

#### 5.2 New Outcome Events

The existing outcome subscription in `initPlayerOutcomes()` already receives ALL outcomes via `queries.outcomes`, but only shows toast notifications for player-owned trips. We need to add feed publishing for all outcomes.

**File**: `packages/client/src/lib/modules/content/index.ts`

Modify the outcomes subscription to publish all outcomes to feed:

```typescript
import { addFeedMessage } from "$lib/components/OperatorFeed/state.svelte"
import { FEED_MESSAGE_TYPE } from "$lib/components/OperatorFeed/Feed/types"

// In the outcomes subscription (around line 200):
outcomesSubscription = client.listen(queries.outcomes, { worldAddress }).subscribe(update => {
  // Handle new outcome notifications (toast only for player's trips - existing logic)
  if (update.transition === "appear" && update.result) {
    const outcome = update.result as SanityOutcome
    const currentContent = get(staticContent)
    const trip = currentContent.trips.find(t => t._id === outcome.tripId)

    // Toast notification only for player's trips (existing behavior)
    if (playerTripIds.includes(outcome.tripId as string)) {
      handleNewOutcome(outcome, currentContent.trips)
    }

    // Feed message for ALL outcomes (new)
    addFeedMessage({
      id: `outcome-${outcome._id}-${Date.now()}`,
      type: FEED_MESSAGE_TYPE.NEW_OUTCOME,
      timestamp: Date.now(),
      tripId: outcome.tripId,
      tripTitle: trip?.title || `Trip #${outcome.tripIndex}`,
      ratName: outcome.ratName,
      playerName: outcome.playerName,
      result: outcome.died ? "died" : "survived",
      valueChange: outcome.valueChange
    })
  }

  // Store update unchanged...
})
```

**Note**: The existing CMS subscription already receives all outcomes, so no changes to Sanity queries are needed.

#### 5.3 Player Joined Events

**File**: `packages/client/src/lib/modules/off-chain-sync/index.ts`

Publish to feed when player joins:

```typescript
import { addFeedMessage } from "$lib/components/OperatorFeed/state.svelte"
import { FEED_MESSAGE_TYPE } from "$lib/components/OperatorFeed/Feed/types"

// In onmessage handler, after detecting new player:
if (!previousIds.has(player.id) && player.id !== currentPlayerId) {
  addFeedMessage({
    id: `player-join-${player.id}-${Date.now()}`,
    type: FEED_MESSAGE_TYPE.PLAYER_JOINED,
    timestamp: Date.now(),
    playerId: player.id,
    playerName: player.name
  })
}
```

---

### Phase 6: Leaderboard UI (Data Deferred)

Build the full UI but leave data empty/mocked. Data loading strategy TBD.

#### 6.1 Leaderboard Data Requirements

Three rankings needed:

1. **Most Valuable Rat** (alive / all-time toggle)
2. **Most Rats Killed by Player** (pastRats value, all-time only)
3. **Most Valuable Trip** (active / all-time toggle)

#### 6.2 Leaderboard Components

Build complete UI with empty/placeholder data:

- `Leaderboard.svelte` - Container with tabs for each ranking type
- `LeaderboardSection.svelte` - Section with title and toggle (where applicable)
- `LeaderboardEntry.svelte` - Row component with rank, name, value
- `LeaderboardToggle.svelte` - Alive/All-time mode switch

#### 6.3 Leaderboard State

```typescript
// Types for leaderboard entries
export type RatLeaderboardEntry = {
  id: string
  name: string
  ownerName: string
  value: number
  rank: number
}

export type KillsLeaderboardEntry = {
  playerId: string
  playerName: string
  kills: number
  rank: number
}

export type TripLeaderboardEntry = {
  tripId: string
  tripTitle: string
  ownerName: string
  balance: number
  rank: number
}

// Stores (empty for now, will be populated when data loading is implemented)
export const ratLeaderboard = writable<RatLeaderboardEntry[]>([])
export const killsLeaderboard = writable<KillsLeaderboardEntry[]>([])
export const tripLeaderboard = writable<TripLeaderboardEntry[]>([])

export const ratLeaderboardMode = writable<"alive" | "all_time">("alive")
export const tripLeaderboardMode = writable<"active" | "all_time">("active")
```

#### 6.4 Future: Hydration Server Endpoints

When data loading is implemented, add to hydration server:

```typescript
// GET /api/leaderboard/rats?mode=alive|all_time&limit=20
// GET /api/leaderboard/kills?limit=20
// GET /api/leaderboard/trips?mode=active|all_time&limit=20
```

---

### Phase 7: Mobile Layout

#### 7.1 Phone Layout

**File**: `packages/client/src/routes/(main)/operator-feed/+layout.svelte`

```svelte
{#if $isPhone}
  <div class="phone-feed-container">
    <div class="phone-feed-content">
      {#if $phoneActiveFeedView === "feed"}
        <Feed />
      {:else}
        <Stats />
      {/if}
    </div>
    {#if FEATURES.ENABLE_LEADERBOARD}
      <SlideToggle
        options={[
          { value: "feed", label: "FEED" },
          { value: "stats", label: "STATS" }
        ]}
        value={$phoneActiveFeedView}
        onchange={v => phoneActiveFeedView.set(v)}
      />
    {/if}
  </div>
{:else}
  <!-- Desktop layout -->
{/if}
```

#### 7.2 Phone View State

**File**: `packages/client/src/lib/modules/ui/state.svelte.ts`

Add:

```typescript
export const phoneActiveFeedView = writable<"feed" | "stats">("feed")
```

---

## Styling Guidelines

### Use Existing Patterns

- Reuse `--game-column-width` CSS variable
- Use existing color variables (`--color-up`, `--color-down`, etc.)
- Follow existing border patterns (`--default-border-style`, `--dashed-border-style`)
- Use existing button components (`SmallButton`, `BigButton`)
- Match font usage (`--special-font-stack`, `--font-size-*`)

### New Styles

- Feed messages should have distinct visual styles per type
- Use subtle background colors to differentiate message types:
  - Chat: neutral/default
  - New Trip: highlight with trip accent
  - Outcome (positive): green-tinted
  - Outcome (negative): red-tinted
  - Player joined: subtle/muted

---

## File Changes Summary

### New Files

**Client**:

- `packages/client/src/lib/config/features.ts`
- `packages/client/src/routes/(main)/operator-feed/+layout.svelte`
- `packages/client/src/routes/(main)/operator-feed/+page.svelte`
- `packages/client/src/lib/components/OperatorFeed/` (entire directory)
- `packages/client/src/lib/modules/off-chain-sync/chat.ts`

**WebSocket Server**:

- `packages/websocket-server/src/modules/chat/sanitize.ts`

### Modified Files

**Client**:

- `packages/client/src/lib/components/Shared/TopBar/OnlineUsers/OnlineUsers.svelte`
- `packages/client/src/lib/modules/off-chain-sync/index.ts`
- `packages/client/src/lib/modules/off-chain-sync/stores.ts`
- `packages/client/src/lib/modules/content/new-trip-notifications.ts`
- `packages/client/src/lib/modules/content/trip-notifications.ts`
- `packages/client/src/lib/modules/ui/state.svelte.ts`

**WebSocket Server**:

- `packages/websocket-server/src/modules/types/index.ts`
- `packages/websocket-server/src/routes/ws-connect/index.ts`

---

## Implementation Order

1. **Phase 1**: Client foundation (route, feature flag, navigation)
2. **Phase 2**: Feed components and state (UI without real-time data)
3. **Phase 3**: WebSocket server chat support
4. **Phase 4**: Client WebSocket chat integration
5. **Phase 5**: Event integration (trips, outcomes, player joins)
6. **Phase 7**: Mobile layout
7. **Phase 6**: Leaderboard (when hydration server is ready)

---

## Decisions

1. **Chat message persistence**: Yes - server stores last 20 messages in memory, sends to client on connection. Use an interface to allow extending to persistent storage later.
2. **Rate limiting**: Yes - 1 message per second per user.
3. **Historical feed on load**: Yes - chat messages only (sent from server on connect).
4. **Moderation tools**: No - not needed for now.
5. **Outcome events**: Show ALL outcomes (not just user's trips). Verify CMS listener filtering supports this.

---

## Dependencies

- WebSocket server changes must be deployed before client chat features
- Leaderboard requires hydration server from `postgresql-filtered-sync.md`
- Feature flag allows incremental deployment

---

## Testing Checklist

- [ ] Route navigation from `.online-users` click
- [ ] Feed displays chat messages in real-time
- [ ] Chat input validates and sends messages
- [ ] Message filtering works correctly
- [ ] Auto-scroll behavior (scroll to bottom, pause when scrolled up)
- [ ] Mobile SlideToggle switches views
- [ ] Feature flag correctly hides leaderboard
- [ ] Full-width feed when leaderboard disabled
- [ ] Player join events appear in feed
- [ ] New trip events appear in feed
- [ ] Outcome events appear in feed
- [ ] Message styling differentiates types
- [ ] WebSocket reconnection preserves chat functionality
