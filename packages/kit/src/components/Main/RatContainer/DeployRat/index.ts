const firstNameFragments = [
  "Lil",
  "Tommy",
  "Bong",
  "Bean",
  "Big",
  "Zaron",
  "Barron",
  "Sarin",
  "Overload",
  "Bag",
  "Bronco",
  "Toothfairy",
  "Enzyme",
  "Gnaw",
  "Korn",
  "Majestica",
  "Biggo",
  "Max",
  "Buddy",
  "NoSleep",
  "Princess",
  "MeatBag",
  "Toothy",
  "Dark",
  "Mr",
  "Mrs",
  "Miss",
  "Doctor",
  "Professor",
  "Sir",
  "Lady",
  "Captain",
  "Double",
  "Triple",
  "The",
  "Commander",
  "Angel",
  "Mc",
  "Wild",
  "Smile",
  "Nekro"
]

const lastNameFragments = [
    "HoldEm",
    "Harvester",
    "Bone",
    "DeCap",
    "Tommy",
    "LoboTomy",
    "Win",
    "Angel",
    "Fist",
    "NeverLose",
    "Strawdog",
    "Pluto",
    "Bong",
    "Bean",
    "Zaron",
    "Barron",
    "Sarin",
    "Overload",
    "Bags",
    "Bronco",
    "SinkOrSwim",
    "Toothfairy",
    "Enzyme",
    "Gnaw",
    "Kornball",
    "Korn",
    "Majestica",
    "Rag",
    "Biggo",
    "Max",
    "Nekro",
    "Buddy",
    "NoSleep",
    "Princess",
    "MeatBag",
    "Toothy",
    "Bowel",
    "Chunks",
    "Claude",
    "Face",
    "Anthrax",
    "Bladder",
    "OrganHarvester",
    "Mover",
    "DarkMode"
  ]

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]
}

function getRandomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export function generateRatName() {
  const firstName = getRandomElement(firstNameFragments)
  const lastName = getRandomElement(lastNameFragments)
  const number = getRandomNumber(100, 999)
  return `${firstName}${lastName}${number}`
}
