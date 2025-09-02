// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
import { ROOM_RESULT_STATE } from "$lib/components/Room/RoomResult/state.svelte"

type RoomEntryState = {
  state: ROOM_RESULT_STATE
  valid: boolean
  processing: boolean
  result: EnterRoomReturnValue | null
  error: boolean
  errorMessage?: string
  frozenRat: FrozenRat | null
  frozenRoom: FrozenRoom | null
}

declare global {
  namespace App {
    // interface Error {}
    // interface Locals {}
    // interface PageData {}
    interface PageState {
      entryState: RoomEntryState
    }
    // interface Platform {}
  }
}

export {}
