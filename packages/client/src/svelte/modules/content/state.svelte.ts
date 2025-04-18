let rooms = $state([])

export const getContentState = () => {
  return {
    rooms: {
      set: (updated: never[]) => {
        rooms = updated
      },
      get current() {
        return rooms
      },
    },
  }
}
