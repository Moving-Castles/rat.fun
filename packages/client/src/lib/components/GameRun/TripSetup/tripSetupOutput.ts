import type { TerminalOutputUnit } from "$lib/modules/terminal-typer/types"
import { UI_STRINGS } from "$lib/modules/ui/ui-strings/index.svelte"

export function generateTripSetupOutput() {
  const tripSetupOutput: TerminalOutputUnit[] = [
    {
      type: "text",
      content: UI_STRINGS.tripSetupPresents,
      color: "white",
      backgroundColor: "black",
      duration: 0,
      delayAfter: 50
    },
    {
      type: "loader",
      content: "",
      duration: 400,
      color: "black",
      backgroundColor: "yellow",
      loaderCharacters: "!",
      delayAfter: 50
    },
    {
      type: "text",
      content: UI_STRINGS.tripSetupWarning,
      duration: 0,
      color: "black",
      backgroundColor: "yellow",
      delayAfter: 50
    },
    {
      type: "loader",
      content: "",
      duration: 400,
      color: "black",
      backgroundColor: "yellow",
      loaderCharacters: "!",
      delayAfter: 50
    },
    {
      type: "text",
      content: UI_STRINGS.tripSetupExperimental,
      color: "black",
      backgroundColor: "yellow",
      duration: 0,
      delayAfter: 50
    },
    {
      type: "text",
      content: UI_STRINGS.tripSetupLiability,
      color: "black",
      backgroundColor: "yellow",
      duration: 0,
      delayAfter: 50
    },
    {
      type: "text",
      content: UI_STRINGS.tripSetupWarranty,
      color: "black",
      backgroundColor: "yellow",
      duration: 0,
      delayAfter: 50
    },
    {
      type: "text",
      content: UI_STRINGS.tripSetupResponsibility,
      color: "black",
      backgroundColor: "yellow",
      duration: 0,
      delayAfter: 50
    },
    {
      type: "text",
      content: UI_STRINGS.tripSetupFault,
      color: "black",
      backgroundColor: "yellow",
      duration: 0,
      delayAfter: 50
    },
    {
      type: "text",
      content: UI_STRINGS.tripSetupSkull,
      color: "black",
      backgroundColor: "yellow",
      duration: 0,
      delayAfter: 50
    },
    {
      type: "loader",
      content: UI_STRINGS.tripSetupSetting,
      duration: 500,
      color: "white",
      backgroundColor: "green",
      loaderCharacters: "#",
      delayAfter: 100
    },
    {
      type: "text",
      content: UI_STRINGS.tripSetupPneumatic,
      color: "white",
      backgroundColor: "black",
      delayAfter: 100
    },
    {
      type: "text",
      content: UI_STRINGS.tripSetupConveyed,
      color: "white",
      backgroundColor: "black",
      delayAfter: 100
    },
    {
      type: "text",
      content: UI_STRINGS.tripSetupDiaper,
      color: "white",
      backgroundColor: "black",
      delayAfter: 100
    },
    {
      type: "text",
      content: UI_STRINGS.tripSetupProbes,
      color: "white",
      backgroundColor: "black",
      delayAfter: 100
    },
    {
      type: "text",
      content: UI_STRINGS.tripSetupDosed,
      color: "white",
      backgroundColor: "black",
      delayAfter: 100
    },
    {
      type: "text",
      content: UI_STRINGS.tripSetupInitiated,
      color: "white",
      backgroundColor: "black",
      delayAfter: 100
    },
    {
      type: "loader",
      content: "",
      color: "orange",
      duration: 4000,
      backgroundColor: "green",
      loaderCharacters: "*"
    }
  ]
  return tripSetupOutput
}
