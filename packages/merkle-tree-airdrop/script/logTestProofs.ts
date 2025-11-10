import fs from "node:fs/promises"
import { Hex } from "viem";
import { getProofFromJson } from "../src";

const data = JSON.parse(await fs.readFile("./static/test_tree.json", "utf8"))

function getProof(account: Hex) {
  return getProofFromJson(account, data)
}

console.log('anvil0', await getProof('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'))
console.log('dk1a', await getProof('0xEA61B46aE53dB45247afA83892EFdB9475e7042C'))
console.log('alice', await getProof('0x88386Fc84bA6bC95484008F6362F93160eF3e563'))
console.log('bob', await getProof('0x717e6a320cf44b4aFAc2b0732D9fcBe2B7fa0Cf6'))
console.log('eve', await getProof('0xC41B3BA8828b3321CA811111fA75Cd3Aa3BB5ACe'))