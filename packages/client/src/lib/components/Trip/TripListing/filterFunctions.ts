/**
 * Filter trips based on the text filter
 * @param entries - The entries to filter
 * @param textFilter - The text filter
 * @returns The filtered entries
 */
export const filterTrips = (entries: [string, Trip][], textFilter: string) => {
  if (textFilter.length > 0) {
    return entries.filter(([_, trip]) =>
      trip.prompt.toLowerCase().includes(textFilter.toLowerCase())
    )
  }
  return entries
}

/**
 * Filter trips based on whether they are depleted or not
 * @param entries - The entries to filter
 * @param showDepletedTrips - Whether to show depleted trips
 * @returns The filtered entries
 */
export const filterDepletedTrips = (entries: [string, Trip][], showDepletedTrips: boolean) => {
  if (!showDepletedTrips) {
    return entries.filter(([_, trip]) => Number(trip.balance || 0) > 0)
  }
  return entries
}
