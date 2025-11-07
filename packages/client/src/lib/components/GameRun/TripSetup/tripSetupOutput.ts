import type { TerminalOutputUnit } from "$lib/modules/terminal-typer/types"

export function generateTripSetupOutput() {
  const tripSetupOutput: TerminalOutputUnit[] = [
    {
      type: "text",
      content: "*** RAT.FUN SCIENTIFIC INSTRUMENTS LLC PRESENTS ***",
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
      content: "WARNING",
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
      content: "THIS IS AN EXPERIMENTAL EXPERIENCE AND MAY BE LETHAL",
      color: "black",
      backgroundColor: "yellow",
      duration: 0,
      delayAfter: 50
    },
    {
      type: "text",
      content: "ABSOLUTELY NO LIABITITY FOR ANY PSYCHOLOGICAL MUTILATION",
      color: "black",
      backgroundColor: "yellow",
      duration: 0,
      delayAfter: 50
    },
    {
      type: "text",
      content:
        "WARRANTY VOIDED. EXTENDS TO THE PLAYER, RAT SUBJECT AND EVERY OTHER ENTITY IN THE WORLD.",
      color: "black",
      backgroundColor: "yellow",
      duration: 0,
      delayAfter: 50
    },
    {
      type: "text",
      content: "BY NOT DESTROYING THIS MACHINE YOU ACCEPT FULL RESPONSIBILITY",
      color: "black",
      backgroundColor: "yellow",
      duration: 0,
      delayAfter: 50
    },
    {
      type: "text",
      content: "EVERYTHING IS YOUR FAULT",
      color: "black",
      backgroundColor: "yellow",
      duration: 0,
      delayAfter: 50
    },
    {
      type: "text",
      content: "ALL EVENTS HAPPEN INSIDE THE SKULL OF THE RAT",
      color: "black",
      backgroundColor: "yellow",
      duration: 0,
      delayAfter: 50
    },
    {
      type: "loader",
      content: "Setting up trip: ",
      duration: 500,
      color: "white",
      backgroundColor: "green",
      loaderCharacters: "#",
      delayAfter: 100
    },
    {
      type: "text",
      content: "= Pneumatic system engaged",
      color: "white",
      backgroundColor: "black",
      delayAfter: 100
    },
    {
      type: "text",
      content: "= Rat conveyed to trip chamber",
      color: "white",
      backgroundColor: "black",
      delayAfter: 100
    },
    {
      type: "text",
      content: "= PETA approved Diaper attached",
      color: "white",
      backgroundColor: "black",
      delayAfter: 100
    },
    {
      type: "text",
      content: "= Intercranial probes attached",
      color: "white",
      backgroundColor: "black",
      delayAfter: 100
    },
    {
      type: "text",
      content: "= Rat dosed with 44mg of Slopamine",
      color: "white",
      backgroundColor: "black",
      delayAfter: 100
    },
    {
      type: "text",
      content: "= Trip initiated: ",
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
