import { Hex } from "viem"

export type TempItem = {
  name: string,
  value: number
}  

export type FrozenRat = Rat & {
  inventory: Array<string | TempItem>
  traits: Array<string | TempItem>
  image: string
}

export type FrozenRoom = Room & {
  id: Hex
}