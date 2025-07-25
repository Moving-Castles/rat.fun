enum ENTITY_TYPE {
  NONE,
  PLAYER,
  RAT,
  ROOM,
  ITEM,
  LEVEL
}

// TODO remove placeholder workaround if you find a better solution (eg make string[] work)
function getEnumKeys(enumObj: Record<string, number | string>): ["PH"] {
  // Filter the keys to remove the numeric ones, leaving only the string keys
  return Object.values(enumObj).filter(key => isNaN(Number(key))) as ["PH"]
}

export function getEnumValues<O extends Record<string, number | string>>(enumObj: O): O[keyof O][] {
  return Object.values(enumObj).filter(key => !isNaN(Number(key))) as never
}

const ENTITY_TYPE_ARRAY = getEnumKeys(ENTITY_TYPE)

export { ENTITY_TYPE, ENTITY_TYPE_ARRAY }
