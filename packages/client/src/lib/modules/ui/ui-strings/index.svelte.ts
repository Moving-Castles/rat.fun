import { enUS } from "./en-US"

const UIStringsData = {
  "en-US": enUS
} as const

type Locale = keyof typeof UIStringsData
type UIStrings = (typeof UIStringsData)[Locale]

// Get initial locale from localStorage or default to en-US
const getInitialLocale = (): Locale => {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("rat-fun-locale") as Locale | null
    if (stored && stored in UIStringsData) {
      return stored
    }
  }
  return "en-US"
}

let currentLocale = $state<Locale>(getInitialLocale())

// Export a getter function instead of derived state
export function getUIStrings(): UIStrings {
  return UIStringsData[currentLocale]
}

// For convenience, create a proxy that works like the old UI_STRINGS
export const UI_STRINGS = new Proxy({} as UIStrings, {
  get(_, prop) {
    return UIStringsData[currentLocale][prop as keyof UIStrings]
  }
})

export const setLocale = (locale: Locale) => {
  currentLocale = locale
  if (typeof window !== "undefined") {
    localStorage.setItem("rat-fun-locale", locale)
  }
}

export const getCurrentLocale = () => currentLocale

export const availableLocales = Object.keys(UIStringsData) as Locale[]

export const localeNames: Record<Locale, string> = {
  "en-US": "English"
}
