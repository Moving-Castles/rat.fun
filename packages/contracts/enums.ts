enum ENTITY_TYPE {
  NONE,
  PLAYER,
  RAT,
  ROOM,
  ITEM,
  TRAIT
}

enum ROOM_TYPE {
  ONE_PLAYER,
  TWO_PLAYER
}

function getEnumNames<T extends object>(enumObj: T): string[] {
  // Filter the keys to remove the numeric ones, leaving only the string keys
  return Object.keys(enumObj).filter((key) => isNaN(Number(key)));
}

const ENTITY_TYPE_ARRAY = getEnumNames(ENTITY_TYPE);
const ROOM_TYPE_ARRAY = getEnumNames(ROOM_TYPE);

export {
  ENTITY_TYPE,
  ENTITY_TYPE_ARRAY,
  ROOM_TYPE,
  ROOM_TYPE_ARRAY
};
