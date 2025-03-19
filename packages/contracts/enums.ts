enum ENTITY_TYPE {
  NONE,
  PLAYER,
  RAT,
  ROOM,
  ITEM,
  TRAIT,
  LEVEL
}

function getEnumNames<T extends object>(enumObj: T): string[] {
  // Filter the keys to remove the numeric ones, leaving only the string keys
  return Object.keys(enumObj).filter((key) => isNaN(Number(key)));
}

const ENTITY_TYPE_ARRAY = getEnumNames(ENTITY_TYPE);

export {
  ENTITY_TYPE,
  ENTITY_TYPE_ARRAY
};
