/**
 * Feature flags for enabling/disabling features
 */
export const FEATURES = {
  /**
   * Enable the Operator Feed feature.
   * When disabled, shows the old online players indicator in the top bar.
   */
  ENABLE_OPERATOR_FEED: false,

  /**
   * Enable the leaderboard section in the Operator Feed.
   * When disabled, the feed takes full width.
   * Set to true once data loading strategy is implemented.
   */
  ENABLE_LEADERBOARD: true
}
