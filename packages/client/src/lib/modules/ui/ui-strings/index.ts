import { enUS } from "./en-US"
import { itBR } from "./it-BR"

const UIStringsData = {
  "en-US": enUS,
  "it-BR": itBR
} as const

type Locale = keyof typeof UIStringsData
type UIStrings = (typeof UIStringsData)[Locale]

const locale: Locale = "en-US"

export const UI_STRINGS: UIStrings = UIStringsData[locale]
