/**
 * ========================================
 *  content/sanity/groq.ts
 * ========================================
 *  GROQ queries for Sanity CMS
 *  https://www.sanity.io/docs/groq
 *
 *  Queries are organized into sections:
 *  1. Singleton documents (single document lookups)
 *  2. Collection queries (lists filtered by worldAddress)
 *  3. Detail queries (single item lookups with params)
 *  4. Composite queries (combined queries for initial load)
 */

// =============================================================================
// SINGLETON DOCUMENTS
// These fetch single, globally-unique documents (not filtered by worldAddress)
// =============================================================================

/**
 * Rat images configuration document
 * Returns all fields from the singleton "rat-images" document
 * Used for: UI rat artwork/icons
 */
const ratImages = '*[_id == "rat-images"][0]{ ... }'

/**
 * Trip folder list configuration document
 * Contains:
 *   - whitelist: array of addresses with special folder access
 *   - folders: array of trip folder references (dereferenced with ->)
 * Used for: Trip organization/categorization in UI
 */
const tripFolderList =
  '*[_id == "trip-folder-list"][0]{ whitelist, folders[]->{ _id, title, description, image, restricted } }'

// =============================================================================
// COLLECTION QUERIES (filtered by worldAddress)
// These queries return arrays of documents for a specific world
// Used for both initial load and real-time subscriptions via client.listen()
// =============================================================================

/**
 * All trips for a world
 * Returns: Full trip documents (no projection, returns all fields)
 * Params: $worldAddress
 * Note: Used for subscriptions. For filtered initial load, use tripsForIds.
 */
const trips = '*[_type == "trip" && worldAddress == $worldAddress]'

/**
 * Trips filtered by IDs array
 * Used by: initTrips() to load only relevant trips (active + player's trips)
 * Params: $tripIds (array of trip document IDs), $worldAddress
 * Note: Trip IDs are determined from on-chain state (balance > 0 OR owned by player)
 */
const tripsForIds = '*[_type == "trip" && _id in $tripIds && worldAddress == $worldAddress]'

/**
 * All outcomes for a world with joined trip data
 * Returns:
 *   - All outcome fields (...)
 *   - trip: the parent trip document (joined via tripId)
 *   - readableLog: formatted log string for display
 * Params: $worldAddress
 * Note: The trip join fetches the full trip document for each outcome
 */
const outcomes = `*[_type == "outcome" && worldAddress == $worldAddress] {
  ...,
  "trip": *[_type == "trip" && _id == ^.tripId][0],
  "readableLog": array::join(log[]{"entry": timestamp + " => " + event}.entry, ", ")
}`

// =============================================================================
// DETAIL QUERIES (single item lookups)
// These fetch individual documents by ID or specific params
// Used for: Page-level data loading (trip detail pages, outcome pages, etc.)
// =============================================================================

/**
 * Outcomes for a specific trip
 * Params: $tripId, $worldAddress
 */
const outcomesForTrip = `*[_type == "outcome" && tripId == $tripId && worldAddress == $worldAddress] {
    ...,
    "readableLog": array::join(log[]{"entry": timestamp + " => " + event}.entry, ", ")
  }`

/**
 * Outcomes for multiple trips (filtered by trip IDs array)
 * Used by: initPlayerOutcomes() to load only outcomes for player's trips
 * Params: $tripIds (array of trip document IDs), $worldAddress
 * Note: Uses GROQ's "in" operator to filter by array membership
 */
const outcomesForTripIds = `*[_type == "outcome" && tripId in $tripIds && worldAddress == $worldAddress] {
  ...,
  "trip": *[_type == "trip" && _id == ^.tripId][0],
  "readableLog": array::join(log[]{"entry": timestamp + " => " + event}.entry, ", ")
}`

/**
 * Outcomes for a specific rat
 * Params: $ratId, $worldAddress
 */
const outcomesForRat = `*[_type == "outcome" && ratId == $ratId && worldAddress == $worldAddress] {
    ...,
    "readableLog": array::join(log[]{"entry": timestamp + " => " + event}.entry, ", ")
  }`

/**
 * Single trip by ID
 * Params: $id, $worldAddress
 */
const singleTrip = `*[_type == "trip" && _id == $id && worldAddress == $worldAddress][0]`

/**
 * Single outcome by ID (no worldAddress filter - outcomes have unique IDs)
 * Params: $id
 */
const singleOutcome = `*[_type == "outcome" && _id == $id][0] {
    ...,
    "readableLog": array::join(log[]{"entry": timestamp + " => " + event}.entry, ", ")
  }`

/**
 * Recent trips for feed history (last N trips ordered by creation time)
 * Params: $worldAddress
 * Used for: Populating operator feed with recent trip creations on load
 */
const recentTripsForFeed = `*[_type == "trip" && worldAddress == $worldAddress] | order(_createdAt desc) [0...5] {
  _id,
  _createdAt,
  index,
  prompt,
  ownerName,
  creationCost
}`

/**
 * Recent outcomes for feed history (last N outcomes ordered by creation time)
 * Params: $worldAddress
 * Used for: Populating operator feed with recent outcomes on load
 */
const recentOutcomesForFeed = `*[_type == "outcome" && worldAddress == $worldAddress] | order(_createdAt desc) [0...5] {
  _id,
  _createdAt,
  tripId,
  tripIndex,
  ratName,
  playerName,
  ratValueChange,
  oldRatBalance,
  newRatBalance,
  inventoryOnEntrance,
  itemChanges,
  itemsLostOnDeath,
  "tripPrompt": *[_type == "trip" && _id == ^.tripId][0].prompt
}`

// =============================================================================
// COMPOSITE QUERIES
// Combined queries for efficient initial data loading
// =============================================================================

/**
 * Static content query (config only) - fetches initial config data
 * Used by: initStaticContent() on app load
 *
 * This combines multiple queries into one request to reduce round-trips.
 * The query fetches:
 *   - ratImages: singleton config for rat artwork
 *   - tripFolders: folder organization config
 *   - tripFolderWhitelist: addresses with folder access
 *
 * NOTE: Trips are loaded separately via initTrips() after spawn,
 * filtered to only active trips (balance > 0) + player's trips.
 * Outcomes are loaded separately via initPlayerOutcomes() after spawn,
 * filtered to only the current player's trips.
 */
const staticContent = `{
  "ratImages": ${ratImages},
  "tripFolders": ${tripFolderList}.folders,
  "tripFolderWhitelist": ${tripFolderList}.whitelist
}`

/**
 * Full static content query (legacy) - fetches ALL data including outcomes
 * Used by: Tourist mode where we don't have a player context
 *
 * @deprecated Prefer using staticContent + initPlayerOutcomes() for authenticated users
 */
const staticContentFull = `{
  "ratImages": ${ratImages},
  "trips": ${trips},
  "outcomes": ${outcomes},
  "tripFolders": ${tripFolderList}.folders,
  "tripFolderWhitelist": ${tripFolderList}.whitelist
}`

// =============================================================================
// EXPORTS
// =============================================================================

export const queries = {
  // Singleton documents
  ratImages,
  tripFolderList,

  // Collection queries (for subscriptions)
  trips,
  tripsForIds,
  outcomes,

  // Detail queries
  outcomesForTrip,
  outcomesForTripIds,
  outcomesForRat,
  singleTrip,
  singleOutcome,

  // Feed history queries
  recentTripsForFeed,
  recentOutcomesForFeed,

  // Composite queries
  staticContent,
  staticContentFull
}
