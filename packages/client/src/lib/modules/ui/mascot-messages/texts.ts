import type { MascotMessageData } from "./types"
import type { TerminalOutputUnit } from "$lib/modules/terminal-typer/types"
import { playSound, randomPitch } from "$lib/modules/sound"

function onType() {
  playSound({ category: "ratfunUI", id: "chirp", pitch: randomPitch() })
}

// Helper to create simple text units
function textLine(content: string): TerminalOutputUnit {
  return {
    type: "text",
    content,
    color: "var(--foreground)",
    typeMode: "word",
    typeSpeed: 100,
    backgroundColor: "transparent",
    onType
  }
}

// ===========================================
// SPECIAL MESSAGES
// ===========================================

export const NEW_PLAYER_MESSAGE: MascotMessageData = {
  text: [textLine("Make the loveless RAT.FUN Psychic Instruments LLC proud, OpErrAtorr!")]
}

export const FIRST_DEATH_MESSAGE: MascotMessageData = {
  text: [
    textLine("rat dead yes"),
    textLine("happens yes. is learning yes"),
    textLine("buy new rat try again yes?")
  ]
}

export const FIRST_CASHOUT_MESSAGE: MascotMessageData = {
  text: [
    textLine("Ah, OpeRatoRR! "),
    textLine("Cash out enough rats OpearatoR!"),
    textLine("We’ll reach the shores of the Walled State of Kowloon opeertor!"),
    textLine("The dark beaches of the Sexc-Hell Islands OpeRatoRR!")
  ]
}

export const BIGWIN_MESSAGE: MascotMessageData = {
  text: [
    textLine("excellent work OPERATOR yes"),
    textLine("big payout yes"),
    textLine("company impressed yes"),
    textLine("reinvest in new rat yes?")
  ]
}

export const ADMIN_UNLOCK_MESSAGE: MascotMessageData = {
  text: [
    textLine("OPERATOR unlocked trip creator yes!"),
    textLine("company trust you now yes"),
    textLine("you make own trips yes"),
    textLine("very good yes"),
    textLine("buy rat try new system yes?")
  ]
}

// ===========================================
// DEATH TRIP MESSAGES
// ===========================================

export const DEATH__TRIP_MESSAGES: MascotMessageData[] = [
  {
    text: [
      textLine("Rat! Rat! Rat! Rat! Rat! Rat! Rat! Rat! Rat! Rat! Rat! Rat! Rat! Rat! Buy RAT!")
    ]
  },
  {
    text: [
      textLine("The world is rat! The soul is rat! The skin is rat! The token is rat! Buy RAT!")
    ]
  },
  {
    text: [
      textLine(
        "Everything is rat! everybody's a rat! everywhere is rats! Rat is in eternity! Buy RAT!"
      )
    ]
  },
  {
    text: [textLine("Another angel rat! Mad this endness! Buy RAT!")]
  },
  {
    text: [textLine("I saw the best rat-minds of my generation destroyed by MadNE$$$$RAT!")]
  },
  {
    text: [textLine("Ah, OPeERtaOR, BUY another RAT! Lead her to transcendence!")]
  },
  {
    text: [
      textLine("It's all true, opPPppperator."),
      textLine("You were created to BUY RAT!"),
      textLine("It's your only purpose.")
    ]
  },
  {
    text: [
      textLine(
        "All OpeRatoRRs' miseries derive from not being able to sit quietly in a slop machine alone. BUY RAT! Feel something!"
      )
    ]
  },
  {
    text: [
      textLine(
        "Ah, operaOpeRatoRRtor! BUY another RAT! Or go home! & cook supper! & listen to the romantic war news on the radio!"
      )
    ]
  },
  {
    text: [textLine("Ah, operator! Never give up OPeERtaOR! Fortune to you OpErAtoooR!")]
  },
  {
    text: [
      textLine("Ah, tonite I witnessed …………. ….. …….."),
      textLine("…………………………."),
      textLine("….")
    ]
  },
  {
    text: [
      textLine(
        "Ah, OpeRatoRR! Cash out enough rats OperatoR! We'll reach the shores of the Walled State of Kowloon opeertor! The dark beaches of the Sexc-Hell Islands OpeRatoRR!"
      )
    ]
  },
  {
    text: [
      textLine(
        "Ah, you speechless and intelligent and shaking with shame OpeRatoRR! Have you lost another RAT? then BUY another RAT!"
      )
    ]
  },
  {
    text: [
      textLine(
        "The loveless RAT.FUN Psychic Instruments LLC values incomprehensible Psycho Objects operator!"
      )
    ]
  },
  {
    text: [
      textLine(
        "Ah, please our money is endless! Cash out your rat and surrender all his inventory to us!"
      )
    ]
  },
  {
    text: [
      textLine(
        "Psycho rats dream machine elves! Trips crack their skulls and eat up their brains and imagination! Cash out before it's too late, opeRRRaator!"
      )
    ]
  },
  {
    text: [
      textLine("Reassess! refocus! restructure! reallocate! recoup! repackage! reinvest! BUY RAT!")
    ]
  },
  {
    text: [textLine("Make the loveless RAT.FUN Psychic Instruments LLC proud, ah, OpErrAtorr!")]
  },
  {
    text: [
      textLine(
        "Trips! Breakthroughs! Come down another time! Highs! Despairs! Heroic rat screams and deaths! New loves! Mad trips! BUY RAT!"
      )
    ]
  },
  {
    text: [
      textLine(
        "Ah, I feel your hungry fatigue OPEratoR! Just another RAT operaAtor! The machine elves smile upon you!"
      )
    ]
  },
  {
    text: [
      textLine("Ah, your father OpeRartor! Ah, your mother opperatorr!"),
      textLine("They were right."),
      textLine("Everything is your fault, always.")
    ]
  },
  {
    text: [
      textLine(
        "Ah, the death engine! The game of skill opeartor! Strategy, the slop machine is delicate!"
      )
    ]
  },
  {
    text: [textLine("Your eyes are red oppppERATOR! Talk to the slop machine! Hear!")]
  },
  {
    text: [textLine("Sad. BUY RAT!")]
  }
]

// ===========================================
// DEATH CASHOUT MESSAGES
// ===========================================

export const DEATH__CASHOUT_MESSAGES: MascotMessageData[] = [
  {
    text: [
      textLine("Rat! Rat! Rat! Rat! Rat! Rat! Rat! Rat! Rat! Rat! Rat! Rat! Rat! Rat! Buy RAT!")
    ]
  },
  {
    text: [
      textLine("The world is rat! The soul is rat! The skin is rat! The token is rat! Buy RAT!")
    ]
  },
  {
    text: [
      textLine(
        "Everything is rat! everybody's a rat! everywhere is rats! Rat is in eternity! Buy RAT!"
      )
    ]
  },
  {
    text: [textLine("Another angel rat! Mad this endness! Buy RAT!")]
  },
  {
    text: [textLine("I saw the best rat-minds of my generation destroyed by MadNE$$$$RAT!")]
  },
  {
    text: [textLine("Ah, OPeERtaOR, BUY another RAT! Lead her to transcendence!")]
  },
  {
    text: [
      textLine("It's all true, opPPppperator."),
      textLine("You were created to BUY RAT!"),
      textLine("It's your only purpose.")
    ]
  },
  {
    text: [
      textLine(
        "All OpeRatoRRs' miseries derive from not being able to sit quietly in a slop machine alone. BUY RAT! Feel something!"
      )
    ]
  },
  {
    text: [
      textLine(
        "Ah, operaOpeRatoRRtor! BUY another RAT! Or go home! & cook supper! & listen to the romantic war news on the radio!"
      )
    ]
  },
  {
    text: [textLine("Ah, operator! Never give up OPeERtaOR! Fortune to you OpErAtoooR!")]
  },
  {
    text: [
      textLine("Ah, tonite I witnessed …………. ….. …….."),
      textLine("…………………………."),
      textLine("….")
    ]
  },
  {
    text: [
      textLine(
        "Ah, OpeRatoRR! Cash out enough rats OperatoR! We'll reach the shores of the Walled State of Kowloon opeertor! The dark beaches of the Sexc-Hell Islands OpeRatoRR!"
      )
    ]
  },
  {
    text: [
      textLine(
        "Ah, you speechless and intelligent and shaking with shame OpeRatoRR! Have you lost another RAT? then BUY another RAT!"
      )
    ]
  },
  {
    text: [
      textLine(
        "The loveless RAT.FUN Psychic Instruments LLC values incomprehensible Psycho Objects operator!"
      )
    ]
  },
  {
    text: [
      textLine(
        "Ah, please our money is endless! Cash out your rat and surrender all his inventory to us!"
      )
    ]
  },
  {
    text: [
      textLine(
        "Psycho rats dream machine elves! Trips crack their skulls and eat up their brains and imagination! Cash out before it's too late, opeRRRaator!"
      )
    ]
  },
  {
    text: [
      textLine("Reassess! refocus! restructure! reallocate! recoup! repackage! reinvest! BUY RAT!")
    ]
  },
  {
    text: [textLine("Make the loveless RAT.FUN Psychic Instruments LLC proud, ah, OpErrAtorr!")]
  },
  {
    text: [
      textLine(
        "Trips! Breakthroughs! Come down another time! Highs! Despairs! Heroic rat screams and deaths! New loves! Mad trips! BUY RAT!"
      )
    ]
  },
  {
    text: [
      textLine(
        "Ah, I feel your hungry fatigue OPEratoR! Just another RAT operaAtor! The machine elves smile upon you!"
      )
    ]
  },
  {
    text: [
      textLine("Ah, your father OpeRartor! Ah, your mother opperatorr!"),
      textLine("They were right."),
      textLine("Everything is your fault, always.")
    ]
  },
  {
    text: [
      textLine(
        "Ah, the death engine! The game of skill opeartor! Strategy, the slop machine is delicate!"
      )
    ]
  },
  {
    text: [textLine("Your eyes are red oppppERATOR! Talk to the slop machine! Hear!")]
  },
  {
    text: [textLine("Sad. BUY RAT!")]
  }
]

// ===========================================
// TEST MESSAGE (for development)
// ===========================================

export const TEST_MESSAGE: MascotMessageData = {
  text: [
    textLine("this is test message yes"),
    textLine("mascot system working yes"),
    textLine("click mascot to dismiss yes")
  ]
}
