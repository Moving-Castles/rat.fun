import type { MascotMessageData } from "./types"
import type { TerminalOutputUnit } from "$lib/modules/terminal-typer/types"

// Helper to create simple text units
function textLine(content: string): TerminalOutputUnit {
  return {
    type: "text",
    content,
    color: "black",
    backgroundColor: "transparent"
  }
}

// ===========================================
// DEATH MESSAGES - Sequential (1-5)
// ===========================================

export const DEATH_MESSAGES_SEQUENTIAL: MascotMessageData[] = [
  // First Death
  {
    text: [
      textLine("rat dead yes"),
      textLine("happens yes. is learning yes"),
      textLine("buy new rat try again yes?")
    ]
  },
  // Second Death
  {
    text: [
      textLine("another rat dead yes"),
      textLine("company say is normal yes"),
      textLine("operators learn from mistakes yes")
    ]
  },
  // Third Death
  {
    text: [
      textLine("three rats dead now yes"),
      textLine("remember: No bad trips, Yes bad rats"),
      textLine("maybe different strategy yes?")
    ]
  },
  // Fourth Death
  {
    text: [
      textLine("four rats yes"),
      textLine("company track this yes"),
      textLine("skill improve with practice yes")
    ]
  },
  // Fifth Death
  {
    text: [
      textLine("five rats dead yes"),
      textLine("you unlock trip creator soon yes"),
      textLine("need survive trips not just buy rats yes")
    ]
  }
]

// ===========================================
// DEATH MESSAGES - Rotating (6+)
// ===========================================

export const DEATH_MESSAGES_ROTATING: MascotMessageData[] = [
  {
    text: [
      textLine("rat dead again yes"),
      textLine("company not judge yes"),
      textLine("just track statistics yes")
    ]
  },
  {
    text: [
      textLine("oh no yes"),
      textLine("well. maybe next rat better yes?"),
      textLine("everything you fault remember yes")
    ]
  },
  {
    text: [
      textLine("rat gone yes"),
      textLine("company say keep trying yes"),
      textLine("skill game take time yes")
    ]
  },
  {
    text: [
      textLine("many rats dead now yes"),
      textLine("you read trip stats yes?"),
      textLine("survival percent important yes")
    ]
  },
  {
    text: [
      textLine("company notice pattern yes"),
      textLine("maybe start with easy trips yes?"),
      textLine("company trips good for learning yes")
    ]
  },
  {
    text: [
      textLine("rat dead fast yes"),
      textLine("you watch trip carefully yes?"),
      textLine("remote viewing show clues yes")
    ]
  },
  {
    text: [
      textLine("another rat for company records yes"),
      textLine("graveyard getting full yes"),
      textLine("buy replacement yes?")
    ]
  },
  {
    text: [
      textLine("rat deceased yes"),
      textLine("you very good at killing rats yes"),
      textLine("this compliment maybe not yes?")
    ]
  },
  {
    text: [
      textLine("company appreciate business yes"),
      textLine("you buy many rats yes"),
      textLine("maybe keep one alive sometime yes?")
    ]
  },
  {
    text: [
      textLine("rat dead yes"),
      textLine("company tip: high survival percent good yes"),
      textLine("low survival percent bad yes"),
      textLine("very helpful tip yes")
    ]
  },
  {
    text: [
      textLine("rat gone yes"),
      textLine("mascot remind you: rats collect objects yes"),
      textLine("objects worth money yes"),
      textLine("rat must survive to collect yes")
    ]
  },
  {
    text: [
      textLine("rat dead again yes"),
      textLine("you know can cash out before death yes?"),
      textLine("kill rat yourself get value yes"),
      textLine("company just saying yes")
    ]
  }
]

// ===========================================
// SPECIAL MESSAGES
// ===========================================

export const BIGWIN_MESSAGE: MascotMessageData = {
  text: [
    textLine("excellent work OPERATOR yes"),
    textLine("big payout yes"),
    textLine("company impressed yes"),
    textLine("reinvest in new rat yes?")
  ]
}

export const FIRST_CASHOUT_MESSAGE: MascotMessageData = {
  text: [
    textLine("good good OPERATOR yes!"),
    textLine("you kill rat get money yes"),
    textLine("this how game work yes"),
    textLine("company proud yes"),
    textLine("buy new rat continue yes?")
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
// TEST MESSAGE (for development)
// ===========================================

export const TEST_MESSAGE: MascotMessageData = {
  text: [
    textLine("this is test message yes"),
    textLine("mascot system working yes"),
    textLine("click mascot to dismiss yes")
  ]
}
