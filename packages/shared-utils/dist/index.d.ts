import { Hex } from 'viem';

/**
 * @ratfun/shared-utils
 * Common utility functions shared across all frontend packages.
 */

/**
 * Converts a string to camel case
 */
declare function toCamelCase(s: string): string;
/**
 * Truncates a string to a given length
 */
declare function truncateString(str: string, maxLength: number): string;
/**
 * Replace unsafe characters with a placeholder.
 * Used to avoid trickery with hidden/non-human readable characters.
 */
declare function renderSafeString(input: string, placeholder?: string, renderCodepoints?: boolean): string;
/**
 * Shortens an Ethereum address for display
 */
declare function shortenAddress(s: string): string;
/**
 * Converts an address to a hex color
 */
declare function addressToColor(address: string): string;
/**
 * Converts an address to a padded 32-byte id
 */
declare function addressToId(address: string): Hex;
/**
 * Converts a padded id back to an unpadded address
 */
declare function idToAddress(paddedAddress: string): string;
/**
 * Deterministically maps an Ethereum address to a number within a specified range
 */
declare function addressToNumber(address: string, max: number): number;
/**
 * Gets unique values from an array
 */
declare function getUniqueValues<T>(arr: T[]): T[];
/**
 * Picks a random element from an array
 */
declare function getRandomElement<T>(array: T[]): T;
/**
 * Picks an element from an array by index (wrapping)
 */
declare function pickByIndex<T>(array: T[], index: number): T;
/**
 * Filters an object by keeping only specified keys
 */
declare function filterObjectByKey(obj: {
    [key: string]: any;
}, keysToKeep: string[]): {
    [key: string]: any;
};
/**
 * Removes keys starting with __ from an object
 */
declare function removePrivateKeys(obj: Record<string, any>): Record<string, any>;
/**
 * Converts a hex string to a regular string
 */
declare function hexToString(hex: string): string;
/**
 * Converts a string to a hex string
 */
declare function stringToHex(string: string): string;
/**
 * Gets a random integer between two numbers (inclusive)
 */
declare function getRandomInt(min: number, max: number): number;
/**
 * Alias for getRandomInt
 */
declare function getRandomNumber(min: number, max: number): number;
/**
 * Generates a random uint256 number
 */
declare function getRandomUint256(): bigint;
/**
 * Generates a random uint32 number
 */
declare function getRandomUint32(): number;
/**
 * Sleeps for a given number of milliseconds
 */
declare function sleep(ms: number): Promise<void>;
/**
 * Calculates human-readable time since a timestamp
 */
declare function timeSince(timestamp: number): string;
/**
 * Calculates formatted time until a timestamp
 */
declare function timeUntil(timestamp: number): string;
/**
 * Calculates milliseconds until a timestamp
 */
declare function millisUntil(timestamp: number): number;
/**
 * Pads a number with a leading zero
 */
declare function padWithZero(value: number): string;
/**
 * Formats a date to HH:MM:SS
 */
declare function formatDate(date: Date): string;
/**
 * Linear interpolation between two values
 */
declare function lerp(x: number, y: number, a: number): number;
/**
 * Clamps a value between min and max
 */
declare function clamp(a: number, min?: number, max?: number): number;
/**
 * Inverse linear interpolation - returns progress (0-1) of value between x and y
 */
declare function invlerp(x: number, y: number, a: number): number;
/**
 * Maps a value from one range to another
 */
declare function range(x1: number, y1: number, x2: number, y2: number, a: number): number;
/**
 * Calculates the proper modulus (handles negative numbers correctly)
 */
declare function mod(n: number, m: number): number;
/**
 * Step easing function for animations
 */
declare function stepsEasing(t: number, steps?: number, direction?: string): number;
/**
 * Pads a number to 78 characters (uint256 max digits)
 */
declare function padToUint256(num: number | bigint): string;
/**
 * Converts blocks to seconds
 */
declare function blocksToSeconds(blocks: number): number;
/**
 * Converts blocks to a readable time string (H:MM:SS)
 */
declare function blocksToReadableTime(blocks: number): string;
/**
 * Error class for JSON parsing failures
 */
declare class JSONParseError extends Error {
    readonly jsonString: string;
    constructor(message: string, jsonString: string);
}
/**
 * Parses JSON from a string, handling markdown code blocks
 */
declare function parseJSONFromContent<T = Record<string, unknown>>(content: string): T;
/**
 * Svelte action to copy text to clipboard on click
 */
declare function clickToCopy(node: HTMLElement, text: string): {
    destroy(): void;
};
/**
 * Detects if the current browser supports extensions (desktop browsers)
 */
declare function hasExtensionSupport(): boolean;
/**
 * Calculate today's CET/CEST time (not rolling to next day).
 * Correctly handles DST transitions using date-fns-tz.
 * @param timeStr Time in HH:MM format (e.g., "16:00")
 * @returns Date object representing that time in Berlin timezone, converted to UTC
 */
declare function getTodayCETTime(timeStr: string): Date;
/**
 * Calculate the next occurrence of a CET/CEST time.
 * If the time has already passed today in Berlin, returns tomorrow's time.
 * Correctly handles DST transitions using date-fns-tz.
 * @param timeStr Time in HH:MM format (e.g., "16:00")
 * @returns Date object representing the next occurrence of that time in Berlin timezone
 */
declare function getNextCETTime(timeStr: string): Date;
/**
 * Format a countdown diff (in ms) to a human-readable string
 */
declare function formatCountdown(diff: number): string;
/**
 * Converts a historical block number to an approximate timestamp.
 * Works backwards from the current block number and current time.
 * @param blockNumber The historical block number to convert
 * @param currentBlockNumber The current block number (from chain)
 * @returns The approximate timestamp in milliseconds (Unix epoch)
 */
declare function blockNumberToTimestamp(blockNumber: number, currentBlockNumber: number): number;
/**
 * Divides a 64-character hex string into 4 equal numeric parts.
 * Useful for deterministically deriving multiple values from a single hash.
 * @param hexString 64+ character hex string (with or without 0x prefix)
 * @returns Array of 4 numbers derived from each quarter of the hash
 */
declare function hexToFourParts(hexString: string): [number, number, number, number];
/**
 * Derives 4 deterministic indices from a hex address, useful for selecting
 * from multiple arrays based on an address hash.
 * @param addressHash A hash of the address (e.g., sha256 result)
 * @param lengths Array of 4 lengths to mod against [bodyLen, armsLen, headLen, earsLen]
 * @returns Array of 4 indices, each within bounds of the corresponding length
 */
declare function hashToIndices(addressHash: string, lengths: [number, number, number, number]): [number, number, number, number];

export { JSONParseError, addressToColor, addressToId, addressToNumber, blockNumberToTimestamp, blocksToReadableTime, blocksToSeconds, clamp, clickToCopy, filterObjectByKey, formatCountdown, formatDate, getNextCETTime, getRandomElement, getRandomInt, getRandomNumber, getRandomUint256, getRandomUint32, getTodayCETTime, getUniqueValues, hasExtensionSupport, hashToIndices, hexToFourParts, hexToString, idToAddress, invlerp, lerp, millisUntil, mod, padToUint256, padWithZero, parseJSONFromContent, pickByIndex, range, removePrivateKeys, renderSafeString, shortenAddress, sleep, stepsEasing, stringToHex, timeSince, timeUntil, toCamelCase, truncateString };
