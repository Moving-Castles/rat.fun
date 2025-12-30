// src/index.ts
import { fromZonedTime, toZonedTime } from "date-fns-tz";
function toCamelCase(s) {
  return s.replace(/([-_][a-z])/gi, ($1) => $1.toUpperCase().replace("-", "").replace("_", "")).replace(/^./, (str) => str.toLowerCase());
}
function truncateString(str, maxLength) {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + "...";
}
function renderSafeString(input, placeholder = "\u{1F480}", renderCodepoints = false) {
  return [...input].map((char) => {
    const code = char.codePointAt(0);
    if (code === void 0) return placeholder;
    const isPUA = code >= 57344 && code <= 63743 || code >= 983040 && code <= 1048573 || code >= 1048576 && code <= 1114109;
    const isTagsBlock = code >= 917504 && code <= 917631;
    const isNonCharacter = (code & 65534) === 65534;
    const isControl = code >= 0 && code <= 31 && ![9, 10, 13].includes(code) || code >= 127 && code <= 159;
    const isZeroWidth = code === 8203 || code === 8204 || code === 8205 || code === 8288 || code === 65279 || code >= 8234 && code <= 8239 || code >= 8294 && code <= 8297;
    const isObscureOrDeprecated = code === 847 || code === 1564 || code === 6158 || code >= 119129 && code <= 119141;
    const isSuspicious = isPUA || isTagsBlock || isNonCharacter || isControl || isZeroWidth || isObscureOrDeprecated;
    if (isSuspicious) {
      if (renderCodepoints) {
        return `[U+${code.toString(16).toUpperCase().padStart(4, "0")}]`;
      } else {
        return placeholder;
      }
    }
    return char;
  }).join("");
}
function shortenAddress(s) {
  return s ? s.slice(0, 5) + "..." + s.slice(-5) : "";
}
function addressToColor(address) {
  if (!address || address.length < 6) return "#FF0000";
  return "#" + address.slice(-6);
}
function addressToId(address) {
  if (!address) return "0x0";
  return "0x" + address.slice(2).padStart(64, "0").toLowerCase();
}
function idToAddress(paddedAddress) {
  if (!paddedAddress) return "0x0";
  return "0x" + paddedAddress.slice(2).replace(/^0+/, "");
}
function addressToNumber(address, max) {
  if (!address) return 0;
  const cleanAddress = address.startsWith("0x") ? address.slice(2) : address;
  let hash = 0;
  for (let i = 0; i < cleanAddress.length; i++) {
    const char = cleanAddress.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash) % (max + 1);
}
function getUniqueValues(arr) {
  return [...new Set(arr)];
}
function getRandomElement(array) {
  const randomIndex = Math.floor(Math.random() * array.length);
  return array[randomIndex];
}
function pickByIndex(array, index) {
  return array[array.length % (index + 1)];
}
function filterObjectByKey(obj, keysToKeep) {
  const filteredObj = {};
  keysToKeep.forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      filteredObj[key] = obj[key];
    }
  });
  return filteredObj;
}
function removePrivateKeys(obj) {
  const newObj = {};
  for (const key in obj) {
    if (!key.startsWith("__")) {
      newObj[key] = obj[key];
    }
  }
  return newObj;
}
function hexToString(hex) {
  hex = hex.substring(2);
  let string = "";
  while (hex.length % 4 != 0) {
    hex = "0" + hex;
  }
  for (let i = 0; i < hex.length; i += 4) {
    string += String.fromCharCode(parseInt(hex.substring(i, i + 4), 16));
  }
  return string;
}
function stringToHex(string) {
  let hex = "";
  for (let i = 0; i < string.length; i++) {
    hex += ((i == 0 ? "" : "000") + string.charCodeAt(i).toString(16)).slice(-4);
  }
  return "0x" + hex.toUpperCase();
}
function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function getRandomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function getRandomUint256() {
  let randomUint256 = BigInt(0);
  for (let i = 0; i < 8; i++) {
    const random32Bits = BigInt(Math.floor(Math.random() * 4294967296));
    randomUint256 = randomUint256 << BigInt(32) | random32Bits;
  }
  return randomUint256;
}
function getRandomUint32() {
  return Math.floor(Math.random() * 4294967296);
}
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
function timeSince(timestamp) {
  const now = Date.now();
  const elapsed = now - timestamp;
  const minutes = Math.floor(elapsed / 6e4);
  const hours = Math.floor(elapsed / 36e5);
  const days = Math.floor(elapsed / 864e5);
  if (days > 0) {
    return `${days} day${days !== 1 ? "s" : ""} ago`;
  } else if (hours > 0) {
    return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
  } else if (minutes > 0) {
    return `${minutes} minute${minutes !== 1 ? "s" : ""} ago`;
  } else {
    return "now";
  }
}
function timeUntil(timestamp) {
  const now = Date.now();
  const remaining = timestamp - now;
  if (remaining <= 0) {
    return "00:00:00";
  }
  const totalSeconds = Math.floor(remaining / 1e3);
  const hours = Math.floor(totalSeconds / 3600) % 24;
  const minutes = Math.floor(totalSeconds % 3600 / 60);
  const days = Math.floor(remaining / 864e5);
  const seconds = totalSeconds % 60;
  const formattedDays = days.toString().padStart(2, "0");
  const formattedHours = hours.toString().padStart(2, "0");
  const formattedMinutes = minutes.toString().padStart(2, "0");
  const formattedSeconds = seconds.toString().padStart(2, "0");
  return `${formattedDays} days ${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
}
function millisUntil(timestamp) {
  return timestamp - Date.now();
}
function padWithZero(value) {
  return value.toString().padStart(2, "0");
}
function formatDate(date) {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
}
function lerp(x, y, a) {
  return x * (1 - a) + y * a;
}
function clamp(a, min = 0, max = 1) {
  return Math.min(max, Math.max(min, a));
}
function invlerp(x, y, a) {
  return clamp((a - x) / (y - x));
}
function range(x1, y1, x2, y2, a) {
  return lerp(x2, y2, invlerp(x1, y1, a));
}
function mod(n, m) {
  return (n % m + m) % m;
}
function stepsEasing(t, steps = 4, direction = "start") {
  t = Math.min(Math.max(t, 0), 1);
  let progress;
  if (direction === "start") {
    progress = Math.floor(t * steps) / steps;
  } else {
    progress = Math.ceil(t * steps) / steps;
    progress = Math.min(progress, 1);
  }
  return progress;
}
function padToUint256(num) {
  return num.toString().padStart(78, "0");
}
var BLOCKTIME = 2;
function blocksToSeconds(blocks) {
  return blocks * BLOCKTIME;
}
function blocksToReadableTime(blocks) {
  const seconds = blocksToSeconds(blocks);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor(seconds % 3600 / 60);
  const secs = seconds % 60;
  const paddedMinutes = minutes < 10 ? `0${minutes}` : `${minutes}`;
  const paddedSeconds = secs < 10 ? `0${secs}` : `${secs}`;
  return `${hours}:${paddedMinutes}:${paddedSeconds}`;
}
var JSONParseError = class extends Error {
  jsonString;
  constructor(message, jsonString) {
    super(message);
    this.name = "JSONParseError";
    this.jsonString = jsonString;
  }
};
function parseJSONFromContent(content) {
  const regex = /```json([\s\S]*?)```/;
  const match = content.match(regex);
  let jsonString;
  if (match && match[1]) {
    jsonString = match[1].trim();
  } else {
    jsonString = content.trim();
  }
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new JSONParseError("Failed to parse JSON: " + errorMessage, jsonString);
  }
}
function clickToCopy(node, text) {
  async function copyText() {
    try {
      await navigator.clipboard.writeText(text);
      node.dispatchEvent(
        new CustomEvent("copysuccess", {
          bubbles: true
        })
      );
    } catch (error) {
      node.dispatchEvent(
        new CustomEvent("copyerror", {
          bubbles: true,
          detail: error
        })
      );
    }
  }
  node.addEventListener("click", copyText);
  return {
    destroy() {
      node.removeEventListener("click", copyText);
    }
  };
}
function hasExtensionSupport() {
  if (typeof window === "undefined") {
    return false;
  }
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
  const isTouchDevice = "ontouchstart" in window || navigator.maxTouchPoints > 0;
  const isSmallScreen = window.innerWidth < 768 || window.innerHeight < 768;
  if (isMobile || isTouchDevice && isSmallScreen) {
    return false;
  }
  return true;
}
var BERLIN_TZ = "Europe/Berlin";
function getTodayCETTime(timeStr) {
  const now = /* @__PURE__ */ new Date();
  const berlinNow = toZonedTime(now, BERLIN_TZ);
  const [hours, minutes] = timeStr.padStart(5, "0").split(":").map(Number);
  const targetInBerlin = new Date(berlinNow);
  targetInBerlin.setHours(hours, minutes, 0, 0);
  return fromZonedTime(targetInBerlin, BERLIN_TZ);
}
function getNextCETTime(timeStr) {
  const now = /* @__PURE__ */ new Date();
  const todayTarget = getTodayCETTime(timeStr);
  if (todayTarget.getTime() > now.getTime()) {
    return todayTarget;
  }
  const berlinNow = toZonedTime(now, BERLIN_TZ);
  const [hours, minutes] = timeStr.padStart(5, "0").split(":").map(Number);
  const tomorrowInBerlin = new Date(berlinNow);
  tomorrowInBerlin.setDate(tomorrowInBerlin.getDate() + 1);
  tomorrowInBerlin.setHours(hours, minutes, 0, 0);
  return fromZonedTime(tomorrowInBerlin, BERLIN_TZ);
}
function formatCountdown(diff) {
  if (diff <= 0) return "";
  const days = Math.floor(diff / (1e3 * 60 * 60 * 24));
  const hours = Math.floor(diff % (1e3 * 60 * 60 * 24) / (1e3 * 60 * 60));
  const minutes = Math.floor(diff % (1e3 * 60 * 60) / (1e3 * 60));
  const seconds = Math.floor(diff % (1e3 * 60) / 1e3);
  if (days > 0) {
    return `${days}d ${hours.toString().padStart(2, "0")}h ${minutes.toString().padStart(2, "0")}m`;
  } else if (hours > 0) {
    return `${hours.toString().padStart(2, "0")}h ${minutes.toString().padStart(2, "0")}m ${seconds.toString().padStart(2, "0")}s`;
  } else if (minutes > 0) {
    return `${minutes.toString().padStart(2, "0")}m ${seconds.toString().padStart(2, "0")}s`;
  } else {
    return `${seconds.toString().padStart(2, "0")}s`;
  }
}
function blockNumberToTimestamp(blockNumber, currentBlockNumber) {
  const currentTime = Date.now();
  const blocksDiff = currentBlockNumber - blockNumber;
  const millisecondsDiff = blocksToSeconds(blocksDiff) * 1e3;
  return currentTime - millisecondsDiff;
}
function hexToFourParts(hexString) {
  const cleanHex = hexString.startsWith("0x") ? hexString.slice(2) : hexString;
  const partLength = 16;
  const part1 = parseInt(cleanHex.slice(0, partLength), 16);
  const part2 = parseInt(cleanHex.slice(partLength, partLength * 2), 16);
  const part3 = parseInt(cleanHex.slice(partLength * 2, partLength * 3), 16);
  const part4 = parseInt(cleanHex.slice(partLength * 3, partLength * 4), 16);
  return [part1, part2, part3, part4];
}
function hashToIndices(addressHash, lengths) {
  const parts = hexToFourParts(addressHash);
  return [
    parts[0] % lengths[0],
    parts[1] % lengths[1],
    parts[2] % lengths[2],
    parts[3] % lengths[3]
  ];
}
export {
  JSONParseError,
  addressToColor,
  addressToId,
  addressToNumber,
  blockNumberToTimestamp,
  blocksToReadableTime,
  blocksToSeconds,
  clamp,
  clickToCopy,
  filterObjectByKey,
  formatCountdown,
  formatDate,
  getNextCETTime,
  getRandomElement,
  getRandomInt,
  getRandomNumber,
  getRandomUint256,
  getRandomUint32,
  getTodayCETTime,
  getUniqueValues,
  hasExtensionSupport,
  hashToIndices,
  hexToFourParts,
  hexToString,
  idToAddress,
  invlerp,
  lerp,
  millisUntil,
  mod,
  padToUint256,
  padWithZero,
  parseJSONFromContent,
  pickByIndex,
  range,
  removePrivateKeys,
  renderSafeString,
  shortenAddress,
  sleep,
  stepsEasing,
  stringToHex,
  timeSince,
  timeUntil,
  toCamelCase,
  truncateString
};
//# sourceMappingURL=index.js.map