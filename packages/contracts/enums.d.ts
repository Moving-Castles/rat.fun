declare enum ENTITY_TYPE {
    NONE = 0,
    PLAYER = 1,
    RAT = 2,
    TRIP = 3,
    ITEM = 4
}
export declare function getEnumValues<O extends Record<string, number | string>>(enumObj: O): O[keyof O][];
declare const ENTITY_TYPE_ARRAY: ["PH"];
export { ENTITY_TYPE, ENTITY_TYPE_ARRAY };
