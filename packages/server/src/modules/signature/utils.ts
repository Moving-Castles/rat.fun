// Unpadded to padded
export function addressToId(address: string): string {
  if (!address) return "0x0"
  // remove '0x' prefix, pad the address with leading zeros up to 64 characters, then add '0x' prefix back
  return "0x" + address.slice(2).padStart(64, "0").toLowerCase()
}
