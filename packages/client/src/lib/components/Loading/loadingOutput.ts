import type { TerminalOutputUnit } from "$lib/modules/terminal-typer/types"

export function generateLoadingOutput() {
  const tripSetupOutput: TerminalOutputUnit[] = [
    {
      type: "text",
      content: "RAT.FUN SCIENTIFIC INSTRUMENTS LLC",
      color: "white",
      backgroundColor: "black",
      duration: 0,
      delayAfter: 100
    },
    {
      type: "text",
      content: "(c) 2034 Sexc-hell island, Kowloon, Hong Kong",
      color: "white",
      backgroundColor: "black",
      duration: 0,
      delayAfter: 100
    },
    {
      type: "text",
      content: "All Rights Reserved in accordance with Maritime Law",
      color: "white",
      backgroundColor: "black",
      duration: 0,
      delayAfter: 100
    },
    {
      type: "text",
      content: "FULLY DISSOCIATED AND DISOWNED SISTER COMPANY OF MOVING CASTLES GMBH",
      color: "white",
      backgroundColor: "black",
      duration: 0,
      delayAfter: 100
    },
    {
      type: "text",
      content: "Patent pending in all non-aligned territories",
      color: "white",
      backgroundColor: "black",
      duration: 0,
      delayAfter: 100
    },
    {
      type: "text",
      content: "FUN and RAT are registered trademarks of RAT.FUN SCIENTIFIC INSTRUMENTS LLC",
      color: "white",
      backgroundColor: "black",
      duration: 0,
      delayAfter: 100
    },
    {
      type: "text",
      content:
        "BY READING THIS TEXT YOU AGREE TO BE BOUND BY THE TERMS OF THE AGREEMENT AND FORFEIT YOUR HUMAN RIGHTS",
      color: "white",
      backgroundColor: "black",
      duration: 0,
      delayAfter: 150
    },
    {
      type: "loader",
      content: "BOOTING SLOP MACHINE...",
      color: "orange",
      duration: 20000,
      typeSpeed: 20,
      backgroundColor: "green",
      loaderCharacters: "*"
    }
  ]
  return tripSetupOutput
}
