/**
 * Feature flags for enabling/disabling features
 */
export const FEATURES = {
  /**
   * Enable the Operator Feed feature.
   * When disabled, shows the old online players indicator in the top bar.
   */
  ENABLE_OPERATOR_FEED: true,

  /**
   * Enable the leaderboard section in the Operator Feed.
   * When disabled, the feed takes full width.
   * Set to true once data loading strategy is implemented.
   */
  ENABLE_LEADERBOARD: true,

  /**
   * Enable challenge trip functionality:
   * - Challenge folder item with countdown timer
   * - Challenge title display
   * - Challenge winner leaderboard
   *
   * When disabled, restricted folders are shown as regular folder items.
   */
  ENABLE_CHALLENGE_TRIPS: false
}
