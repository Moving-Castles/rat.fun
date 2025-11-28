import type { TerminalOutputUnit } from "$lib/modules/terminal-typer/types"
import { UI_STRINGS } from "$lib/modules/ui/ui-strings/index.svelte"

export function generateLoadingOutput() {
  const tripSetupOutput: TerminalOutputUnit[] = [
    {
      type: "text",
      content: UI_STRINGS.loadingCompany,
      color: "white",
      backgroundColor: "black",
      duration: 0,
      delayAfter: 100
    },
    {
      type: "text",
      content: UI_STRINGS.loadingCopyright,
      color: "white",
      backgroundColor: "black",
      duration: 0,
      delayAfter: 100
    },
    {
      type: "text",
      content: UI_STRINGS.loadingRights,
      color: "white",
      backgroundColor: "black",
      duration: 0,
      delayAfter: 100
    },
    {
      type: "text",
      content: UI_STRINGS.loadingDissociated,
      color: "white",
      backgroundColor: "black",
      duration: 0,
      delayAfter: 100
    },
    {
      type: "text",
      content: UI_STRINGS.loadingPatent,
      color: "white",
      backgroundColor: "black",
      duration: 0,
      delayAfter: 100
    },
    {
      type: "text",
      content: UI_STRINGS.loadingTrademarks,
      color: "white",
      backgroundColor: "black",
      duration: 0,
      delayAfter: 100
    },
    {
      type: "text",
      content: UI_STRINGS.loadingAgreement,
      color: "white",
      backgroundColor: "black",
      duration: 0,
      delayAfter: 150
    },
    {
      type: "text",
      content: UI_STRINGS.loadingBoot,
      color: "cyan",
      backgroundColor: "black",
      delayAfter: 10
    },
    {
      type: "loader",
      content: "",
      color: "orange",
      duration: 20000,
      typeSpeed: 20,
      backgroundColor: "green",
      loaderCharacters: "*"
    }
  ]
  return tripSetupOutput
}
