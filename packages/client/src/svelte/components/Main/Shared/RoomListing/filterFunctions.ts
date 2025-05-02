export const filterRooms = (entries: [string, Room][], textFilter: string) => {
  if (textFilter.length > 0) {
    return entries.filter(([_, room]) =>
      room.roomPrompt.toLowerCase().includes(textFilter.toLowerCase())
    )
  }
  return entries
}

export const filterDepletedRooms = (entries: [string, Room][], showDepletedRooms: boolean) => {
  if (!showDepletedRooms) {
    return entries.filter(([_, room]) => Number(room.balance || 0) > 0)
  }
  return entries
} 