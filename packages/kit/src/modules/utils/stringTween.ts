import { tweened } from "svelte/motion";
import { readable } from "svelte/store";
import { get } from "svelte/store";

// Utility to pad strings to a common length
const padStringToLength = (str: string, length: number): string =>
  str.padEnd(length, " ");

// Initializes a store for each character in the string
const initCharStores = (str: string, duration: number = 500) =>
  str.split("").map((char) => tweened(char.charCodeAt(0), { duration }));

// Type for the listener function
type Listener = (value: string) => void;

// Factory function to create the tween store
export const createTweenStore = (duration: number) => {
  let charStores: ReturnType<typeof tweened>[] = [];
  let maxLen: number = 0;

  // Updates character stores based on a new string
  const updateStores = (newStr: string): void => {
    const paddedStr = padStringToLength(newStr, maxLen);

    paddedStr.split("").forEach((char, i) => {
      if (charStores[i]) {
        charStores[i].set(char.charCodeAt(0));
      } else {
        charStores.push(tweened(char.charCodeAt(0), { duration }));
      }
    });
  };

  // Subscribe function for the store
  const subscribe = (listener: Listener): (() => void) => {
    const unsubscribeFunctions = charStores.map((store) =>
      store.subscribe(() => {
        const combinedString = String.fromCharCode(
          ...charStores.map((store) => get(store))
        );
        listener(combinedString);
      })
    );

    // Return an unsubscribe function to clean up listeners
    return () => unsubscribeFunctions.forEach((unsubscribe) => unsubscribe());
  };

  return {
    /**
     * Sets the strings to animate and initializes stores
     * @param strings Array of strings to animate
     */
    setStrings(strings: string[]): void {
      maxLen = Math.max(...strings.map((str) => str.length));

      // Initialize stores for the longest string
      charStores = initCharStores(
        padStringToLength(strings[0], maxLen),
        duration
      );

      // Update stores for each string in sequence
      strings.forEach((str) => updateStores(str));
    },
    subscribe: readable<string>("", subscribe).subscribe,
  };
};
