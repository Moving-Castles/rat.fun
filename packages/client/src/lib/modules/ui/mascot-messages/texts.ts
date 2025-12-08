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

// Uses {DEAD_RAT_NAME} placeholder
export const FIRST_DEATH_MESSAGE: MascotMessageData = {
  text: [
    textLine("{DEAD_RAT_NAME} has returned to dust."),
    textLine("Everything is lost OpeRaotr!"),
    textLine("DESPAIR!"),
    textLine("BUY NEW RAT!")
  ]
}

export const FIRST_CASHOUT_MESSAGE: MascotMessageData = {
  text: [
    textLine("Ah, OpeRatoRR!"),
    textLine("Cash out enough rats OpearatoR!"),
    textLine("We'll reach the shores of the Walled State of Kowloon opeertor!"),
    textLine("The dark beaches of the Sexc-Hell Islands OpeRatoRR!")
  ]
}

export const BIGWIN_MESSAGE: MascotMessageData = {
  text: [
    textLine("excellent work OPERATOR"),
    textLine("big payout"),
    textLine("company impressed"),
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
// Uses {DEAD_RAT_COUNT} and {DEAD_RAT_NAME} placeholders
// ===========================================

export const DEATH__TRIP_MESSAGES: MascotMessageData[] = [
  {
    text: [
      textLine("{DEAD_RAT_COUNT} angel rats!"),
      textLine("Mad this endness!"),
      textLine("BUY new RAT!")
    ]
  },
  {
    text: [textLine("{DEAD_RAT_COUNT} dead rats!"), textLine("BUY another RAT!")]
  },
  {
    text: [
      textLine("Ah, operator!"),
      textLine("Never give up OPeERtaOR!"),
      textLine("Fortune to you OpErAtoooR!")
    ]
  },
  {
    text: [
      textLine("Ah, you speechless and intelligent and shaking with shame OpeRatoRR!"),
      textLine("You have lost {DEAD_RAT_COUNT} RATS?"),
      textLine("then BUY another RAT!")
    ]
  },
  {
    text: [
      textLine("{DEAD_RAT_COUNT} psycho rats dreamt machine elves!"),
      textLine(
        "Trips cracked {DEAD_RAT_COUNT} skulls and ate up {DEAD_RAT_COUNT} brains with their imagination!"
      ),
      textLine("Cash out before it's too late, opeRRRaator!")
    ]
  },
  {
    text: [textLine("Sad."), textLine("{DEAD_RAT_NAME} passed."), textLine("BUY new RAT!")]
  },
  {
    text: [
      textLine("Ah, the death engine!"),
      textLine("The game of skill opeartor!"),
      textLine("Strategy, the slop machine is delicate!")
    ]
  },
  {
    text: [
      textLine("{DEAD_RAT_NAME} is DEAD opppeerator!"),
      textLine("It's all your fault OPperatoor!"),
      textLine("ALWAYS!")
    ]
  },
  {
    text: [textLine("HEROIC!"), textLine("{DEAD_RAT_NAME}!"), textLine("WE WILL REMEMBER!")]
  },
  {
    text: [
      textLine("RAT.FUN Psychic Instruments LLC salutes {DEAD_RAT_NAME}."),
      textLine("BUY new RAT!")
    ]
  },
  {
    text: [
      textLine("Trips!"),
      textLine("Breakthroughs!"),
      textLine("Come down another time!"),
      textLine("Highs!"),
      textLine("Despairs!"),
      textLine("{DEAD_RAT_COUNT} heroic rats' screams and deaths!"),
      textLine("New loves!"),
      textLine("Mad trips!"),
      textLine("BUY NEW RAT!")
    ]
  },
  {
    text: [textLine("{DEAD_RAT_NAME} returned to dust?"), textLine("BUY NEW RAT!")]
  },
  {
    text: [
      textLine("{DEAD_RAT_COUNT}!"),
      textLine("Reassess!"),
      textLine("Refocus!"),
      textLine("Restructure!"),
      textLine("Reallocate!"),
      textLine("Recoup!"),
      textLine("Repackage!"),
      textLine("Reinvest!")
    ]
  },
  {
    text: [
      textLine("Ah, I feel your hungry fatigue OPEratoR!"),
      textLine("Just another RAT operaAtor!"),
      textLine("The machine elves grin upon you!")
    ]
  }
]

// ===========================================
// DEATH CASHOUT MESSAGES
// ===========================================

export const DEATH__CASHOUT_MESSAGES: MascotMessageData[] = [
  {
    text: [
      textLine("Rat!"),
      textLine("Rat!"),
      textLine("Rat!"),
      textLine("Rat!"),
      textLine("Rat!"),
      textLine("Rat!"),
      textLine("Rat!"),
      textLine("Rat!"),
      textLine("Rat!"),
      textLine("Rat!"),
      textLine("Buy RAT!")
    ]
  },
  {
    text: [
      textLine("The world is rat!"),
      textLine("The soul is rat!"),
      textLine("The skin is rat!"),
      textLine("The token is rat!"),
      textLine("Buy RAT!")
    ]
  },
  {
    text: [
      textLine("Everything is rat!"),
      textLine("everybody's a rat!"),
      textLine("everywhere is rats!"),
      textLine("Rat is in eternity!"),
      textLine("Buy RAT!")
    ]
  },
  {
    text: [textLine("I saw the best rat-minds of my generation destroyed by MadNE$$RAT!")]
  },
  {
    text: [textLine("Ah, OPeERtaOR, BUY another RAT!"), textLine("Lead her to transcendence!")]
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
        "All OpeRatoRRs' miseries derive from not being able to sit quietly in a slop machine alone."
      ),
      textLine("BUY RAT!"),
      textLine("Feel something!")
    ]
  },
  {
    text: [
      textLine("Ah, operaOpeRatoRRtor!"),
      textLine("BUY another RAT!"),
      textLine("Or go home!"),
      textLine("& cook supper!"),
      textLine("& listen to the romantic war news on the radio!")
    ]
  },
  {
    text: [textLine("Ah, tonite I witnessed …………. ….. …….."), textLine("…………………………. ….")]
  },
  {
    text: [
      textLine(
        "The loveless RAT.FUN Psychic Instruments LLC values incomprehensible Psycho Objects operartor!"
      ),
      textLine("CASH OUT!")
    ]
  },
  {
    text: [
      textLine("Ah, please our money is endless!"),
      textLine("Cash out your rat and surrender all his inventory to us!")
    ]
  },
  {
    text: [
      textLine("Ah, your father OpeRartor!"),
      textLine("Ah, your mother opperatorr!"),
      textLine("They were right."),
      textLine("Everything is your fault, always.")
    ]
  },
  {
    text: [
      textLine("Your eyes are red oppppERATOR!"),
      textLine("Talk to the slop machine!"),
      textLine("Hear!")
    ]
  },
  {
    text: [
      textLine("Let's reach the shores of the Walled State of Kowloon opeertor!"),
      textLine("BUY RAT!")
    ]
  },
  {
    text: [
      textLine("The dark beaches of the Sexc-Hell Islands OpeRRatoRR!"),
      textLine("I see them!"),
      textLine("Just another RAT!")
    ]
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
