/**
 * Filter rooms based on the text filter
 * @param entries - The entries to filter
 * @param textFilter - The text filter
 * @returns The filtered entries
 */
export const filterRooms = (entries: [string, Room][], textFilter: string) => {
  if (textFilter.length > 0) {
    return entries.filter(([_, room]) =>
      room.prompt.toLowerCase().includes(textFilter.toLowerCase())
    )
  }
  return entries
}

/**
 * Filter rooms based on whether they are depleted or not
 * @param entries - The entries to filter
 * @param showDepletedRooms - Whether to show depleted rooms
 * @returns The filtered entries
 */
export const filterDepletedRooms = (entries: [string, Room][], showDepletedRooms: boolean) => {
  if (!showDepletedRooms) {
    return entries.filter(([_, room]) => Number(room.balance || 0) > 0)
  }
  return entries
}
