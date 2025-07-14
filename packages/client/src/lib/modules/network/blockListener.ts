import { get } from "svelte/store"
import { publicNetwork, blockNumber } from "./index"

let blockTimeout: number
const TIMEOUT = 60000

export function initBlockListener() {
  get(publicNetwork).latestBlock$.subscribe(block => {
    // Show a error message if we haven't received a block in a while
    clearTimeout(blockTimeout)
    blockTimeout = window.setTimeout(handleBlockTimeout, TIMEOUT)
    // For convenience, we store the block number in a svelte store
    blockNumber.set(block.number ?? BigInt(0))
  })
}

function handleBlockTimeout() {
  console.error("Block timeout")
}
