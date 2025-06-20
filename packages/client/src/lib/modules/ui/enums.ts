export enum UI {
  LOADING = 'loading',
  SPAWNING = 'spawning',
  READY = 'ready',
  ERROR = 'error'
}

export enum LOCATION {
  NONE = 'none',
  MAIN = 'main'
}

export enum PANE {
  NONE = 'none',
  ROOM_CONTAINER = 'room_container',
  MIDDLE = 'middle',
  RAT_CONTAINER = 'rat_container'
}

export enum RAT_CONTAINER {
  YOUR_RAT = 'your_rat'
}

export enum ROOM_CONTAINER {
  ALL_ROOMS = 'all_rooms',
  YOUR_ROOMS = 'your_rooms',
  CREATE_ROOM = 'create_room',
  SINGLE_ROOM = 'single_room'
}

export enum SPAWN_STATE {
  INTRODUCTION = 'introduction',
  CONNECT_WALLET = 'connect_wallet',
  SHOW_FORM = 'show_form',
  BUSY = 'busy'
}
