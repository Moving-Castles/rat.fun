import fs from "node:fs/promises"
import { createReadStream } from "node:fs"
import path from "node:path"
import readline from "node:readline"
import { Command } from "commander"
import {
  AbiEvent,
  Address,
  Chain,
  createPublicClient,
  formatUnits,
  GetLogsParameters,
  http,
  keccak256,
  parseEventLogs,
  ParseEventLogsReturnType
} from "viem"
import { getChain } from "@ratfun/common/basic-network"
import { derc20BuyLimitAbi, poolManagerAbi, readAuctionParams } from "../src"
import { getAddresses } from "@whetstone-research/doppler-sdk"

type AuctionParams = NonNullable<ReturnType<typeof readAuctionParams>>
type PublicClientInstance = ReturnType<typeof createPublicClient>
type ReceiptLog = Extract<
  ParseEventLogsReturnType<typeof derc20BuyLimitAbi>[number],
  { eventName: "Receipt" }
>
type PoolSwapLog = Extract<
  ParseEventLogsReturnType<typeof poolManagerAbi>[number],
  {
    eventName: "Swap"
  }
>

type ReceiptRow = {
  blockNumber: bigint
  datetime: string
  logIndex: bigint
  transactionHash: string
  buyer: string
  countryCode: string
  tokenAmountFormatted: string
  numeraireAmountFormatted: string
  tokenAmountRaw: bigint
  numeraireAmountRaw: bigint
}

type SwapRow = {
  blockNumber: bigint
  datetime: string
  logIndex: bigint
  transactionHash: string
  sender: string
  tokenAmountFormatted: string
  numeraireAmountFormatted: string
  tokenAmountRaw: bigint
  numeraireAmountRaw: bigint
}

type ReceiptBucket = {
  blockNumber: bigint
  entries: ReceiptRow[]
}

type MatchStats = {
  matchedReceiptCount: number
  unmatchedReceiptCount: number
  rowsWritten: number
}

type LogChunkOptions = {
  event?: AbiEvent
  args?: Record<string, unknown>
  strict?: boolean
}

const ISO_ALPHA2_CODES = [
  "AF",
  "AX",
  "AL",
  "DZ",
  "AS",
  "AD",
  "AO",
  "AI",
  "AQ",
  "AG",
  "AR",
  "AM",
  "AW",
  "AU",
  "AT",
  "AZ",
  "BS",
  "BH",
  "BD",
  "BB",
  "BY",
  "BE",
  "BZ",
  "BJ",
  "BM",
  "BT",
  "BO",
  "BQ",
  "BA",
  "BW",
  "BV",
  "BR",
  "IO",
  "BN",
  "BG",
  "BF",
  "BI",
  "CV",
  "KH",
  "CM",
  "CA",
  "KY",
  "CF",
  "TD",
  "CL",
  "CN",
  "CX",
  "CC",
  "CO",
  "KM",
  "CD",
  "CG",
  "CK",
  "CR",
  "CI",
  "HR",
  "CU",
  "CW",
  "CY",
  "CZ",
  "DK",
  "DJ",
  "DM",
  "DO",
  "EC",
  "EG",
  "SV",
  "GQ",
  "ER",
  "EE",
  "SZ",
  "ET",
  "FK",
  "FO",
  "FJ",
  "FI",
  "FR",
  "GF",
  "PF",
  "TF",
  "GA",
  "GM",
  "GE",
  "DE",
  "GH",
  "GI",
  "GR",
  "GL",
  "GD",
  "GP",
  "GU",
  "GT",
  "GG",
  "GN",
  "GW",
  "GY",
  "HT",
  "HM",
  "VA",
  "HN",
  "HK",
  "HU",
  "IS",
  "IN",
  "ID",
  "IR",
  "IQ",
  "IE",
  "IM",
  "IL",
  "IT",
  "JM",
  "JP",
  "JE",
  "JO",
  "KZ",
  "KE",
  "KI",
  "KP",
  "KR",
  "KW",
  "KG",
  "LA",
  "LV",
  "LB",
  "LS",
  "LR",
  "LY",
  "LI",
  "LT",
  "LU",
  "MO",
  "MG",
  "MW",
  "MY",
  "MV",
  "ML",
  "MT",
  "MH",
  "MQ",
  "MR",
  "MU",
  "YT",
  "MX",
  "FM",
  "MD",
  "MC",
  "MN",
  "ME",
  "MS",
  "MA",
  "MZ",
  "MM",
  "NA",
  "NR",
  "NP",
  "NL",
  "NC",
  "NZ",
  "NI",
  "NE",
  "NG",
  "NU",
  "NF",
  "MK",
  "MP",
  "NO",
  "OM",
  "PK",
  "PW",
  "PS",
  "PA",
  "PG",
  "PY",
  "PE",
  "PH",
  "PN",
  "PL",
  "PT",
  "PR",
  "QA",
  "RE",
  "RO",
  "RU",
  "RW",
  "BL",
  "SH",
  "KN",
  "LC",
  "MF",
  "PM",
  "VC",
  "WS",
  "SM",
  "ST",
  "SA",
  "SN",
  "RS",
  "SC",
  "SL",
  "SG",
  "SX",
  "SK",
  "SI",
  "SB",
  "SO",
  "ZA",
  "GS",
  "SS",
  "ES",
  "LK",
  "SD",
  "SR",
  "SJ",
  "SE",
  "CH",
  "SY",
  "TW",
  "TJ",
  "TZ",
  "TH",
  "TL",
  "TG",
  "TK",
  "TO",
  "TT",
  "TN",
  "TR",
  "TM",
  "TC",
  "TV",
  "UG",
  "UA",
  "AE",
  "GB",
  "US",
  "UM",
  "UY",
  "UZ",
  "VU",
  "VE",
  "VN",
  "VG",
  "VI",
  "WF",
  "EH",
  "YE",
  "ZM",
  "ZW"
]
const COUNTRY_CODE_HASHES = new Map<string, string>()
const TEXT_ENCODER = new TextEncoder()
for (const code of ISO_ALPHA2_CODES) {
  COUNTRY_CODE_HASHES.set(keccak256(TEXT_ENCODER.encode(code)).toLowerCase(), code)
}

const receiptEventDefinition =
  derc20BuyLimitAbi.find(item => item.type === "event" && item.name === "Receipt") ??
  (() => {
    throw new Error("Receipt event missing from derc20BuyLimitAbi")
  })()

const swapEventDefinition =
  poolManagerAbi.find(item => item.type === "event" && item.name === "Swap") ??
  (() => {
    throw new Error("Swap event missing from poolManagerAbi")
  })()

const program = new Command()
program
  .requiredOption("-c, --chain-id <CHAINID>", "Chain id", (val: string) => parseInt(val, 10), 84532)
  .option("-o, --output <PATH>", "CSV output path")
  .option("--from-block <BLOCK>", "Starting block number", (val: string) => BigInt(val))
  .option("--to-block <BLOCK>", "Ending block number", (val: string) => BigInt(val))
  .option("--use-existing-csv", "Skip RPC fetch and reuse the receipt/swap CSV files")
  .parse(process.argv)

const options = program.opts<{
  chainId: number
  output?: string
  fromBlock?: bigint
  toBlock?: bigint
  useExistingCsv?: boolean
}>()
const chainId = options.chainId
const fromBlock = options.fromBlock ?? 0n
const toBlock = options.toBlock
const chain = getChain(chainId) as Chain

const publicClient = createPublicClient({
  chain,
  transport: http()
})

const auctionParams = readAuctionParams(chainId)
if (!auctionParams) throw new Error(`Auction params not found for chainId ${chainId}`)

const addresses = getAddresses(chainId)
const poolManagerAddress = addresses.poolManager as Address | undefined
if (!poolManagerAddress) throw new Error(`Pool manager not known for chainId ${chainId}`)

const outputTarget = path.resolve(options.output ?? `receipt-events-${chainId}.csv`)
const { dir, name } = path.parse(outputTarget)
const baseName = name || `receipt-events-${chainId}`
const receiptCsvPath = path.join(dir, `${baseName}-receipts.csv`)
const swapCsvPath = path.join(dir, `${baseName}-swaps.csv`)
const joinedCsvPath = path.join(dir, `${baseName}.csv`)

const receiptHeader = [
  "blockNumber",
  "datetime",
  "logIndex",
  "transactionHash",
  "buyer",
  "countryCode",
  "tokenAmount",
  "numeraireAmount",
  "tokenAmountRaw",
  "numeraireAmountRaw"
]
const swapHeader = [
  "blockNumber",
  "datetime",
  "logIndex",
  "transactionHash",
  "sender",
  "tokenAmount",
  "numeraireAmount",
  "tokenAmountRaw",
  "numeraireAmountRaw"
]
const joinedHeader = [
  "blockNumber",
  "datetime",
  "logIndex",
  "transactionHash",
  "sender",
  "tokenAmount",
  "numeraireAmount",
  "receiptBlockNumber",
  "receiptDatetime",
  "receiptLogIndex",
  "receiptTransactionHash",
  "receiptBuyer",
  "receiptCountryCode",
  "receiptTokenAmount",
  "receiptNumeraireAmount"
]
const useExistingCsv = options.useExistingCsv ?? false

await fs.mkdir(dir, { recursive: true })

if (useExistingCsv) {
  await ensureCsvExists(receiptCsvPath)
  await ensureCsvExists(swapCsvPath)
  console.log(`Reusing existing CSVs: ${receiptCsvPath} and ${swapCsvPath}`)
} else {
  const receiptCount = await writeReceiptCsv(
    publicClient,
    auctionParams,
    fromBlock,
    toBlock,
    receiptCsvPath
  )
  console.log(`Saved ${receiptCount} receipts to ${receiptCsvPath}`)

  const swapCount = await writeSwapCsv(
    publicClient,
    poolManagerAddress,
    auctionParams,
    fromBlock,
    toBlock,
    swapCsvPath
  )
  console.log(`Saved ${swapCount} pool swaps to ${swapCsvPath}`)
}

const joinResult = await joinCsvs(receiptCsvPath, swapCsvPath, joinedCsvPath)
const receiptSummary = joinResult.unmatchedReceiptCount
  ? `${joinResult.matchedReceiptCount} matched, ${joinResult.unmatchedReceiptCount} remaining receipts`
  : `${joinResult.matchedReceiptCount} matched`
console.log(
  `Saved ${joinResult.rowsWritten} pool swaps (${receiptSummary}) for ${auctionParams.token.symbol} to ${joinedCsvPath}`
)

async function writeReceiptCsv(
  publicClient: PublicClientInstance,
  auctionParams: AuctionParams,
  fromBlock: bigint,
  toBlock: bigint | undefined,
  filePath: string
) {
  await writeCsvHeader(filePath, receiptHeader)
  let rowCount = 0
  const blockCache = new Map<bigint, string>()
  for await (const logs of iterateLogChunks(publicClient, {
    address: auctionParams.token.address as Address,
    fromBlock,
    toBlock,
    logOptions: { event: receiptEventDefinition as AbiEvent }
  })) {
    const parsedLogs = parseEventLogs({ abi: derc20BuyLimitAbi, logs }).filter(
      log => log.eventName === "Receipt"
    ) as ReceiptLog[]
    const sortedLogs = parsedLogs.slice().sort(compareLogs)
    if (!sortedLogs.length) continue
    const rows = await Promise.all(
      sortedLogs.map(receipt => formatReceiptRow(receipt, auctionParams, publicClient, blockCache))
    )
    await appendCsvRows(filePath, rows)
    rowCount += rows.length
  }
  return rowCount
}

async function writeSwapCsv(
  publicClient: PublicClientInstance,
  poolManagerAddress: Address,
  auctionParams: AuctionParams,
  fromBlock: bigint,
  toBlock: bigint | undefined,
  filePath: string
) {
  await writeCsvHeader(filePath, swapHeader)
  let rowCount = 0
  const blockCache = new Map<bigint, string>()
  for await (const logs of iterateLogChunks(publicClient, {
    address: poolManagerAddress,
    fromBlock,
    toBlock,
    logOptions: {
      event: swapEventDefinition as AbiEvent,
      args: { id: auctionParams.poolId }
    }
  })) {
    const parsedLogs = parseEventLogs({ abi: poolManagerAbi, logs })
      .filter(log => log.eventName === "Swap" && log.args.id === auctionParams.poolId)
      .map(log => log as PoolSwapLog)
    const sortedLogs = parsedLogs.slice().sort(compareLogs)
    if (!sortedLogs.length) continue
    const rows = await Promise.all(
      sortedLogs.map(swap => formatSwapRow(swap, auctionParams, publicClient, blockCache))
    )
    await appendCsvRows(filePath, rows)
    rowCount += rows.length
  }
  return rowCount
}

async function joinCsvs(
  receiptCsvPath: string,
  swapCsvPath: string,
  joinedCsvPath: string
): Promise<MatchStats> {
  await writeCsvHeader(joinedCsvPath, joinedHeader)
  const receiptIterator = readReceiptRows(receiptCsvPath)
  const swapIterator = readSwapRows(swapCsvPath)
  let receiptResult = await receiptIterator.next()
  const receiptMap = new Map<string, ReceiptBucket>()
  let matchedReceiptCount = 0
  let rowsWritten = 0
  let lastSwapBlock = -1n
  let unmatchedReceiptCount = 0

  for await (const swapRow of swapIterator) {
    if (swapRow.blockNumber > lastSwapBlock) {
      dropReceiptsBefore(receiptMap, swapRow.blockNumber, count => {
        unmatchedReceiptCount += count
      })
      lastSwapBlock = swapRow.blockNumber
    }

    while (!receiptResult.done && receiptResult.value.blockNumber <= swapRow.blockNumber) {
      enqueueReceipt(receiptMap, receiptResult.value)
      receiptResult = await receiptIterator.next()
    }

    const key = matchKey(swapRow.blockNumber, swapRow.tokenAmountRaw)
    const bucket = receiptMap.get(key)
    const matchedReceipt = bucket?.entries.shift()
    if (bucket && bucket.entries.length === 0) {
      receiptMap.delete(key)
    }
    if (matchedReceipt) {
      matchedReceiptCount++
    }

    const decodedCountry = decodeCountryCode(matchedReceipt?.countryCode)
    const joinedRow = [
      stringOrEmpty(swapRow.blockNumber),
      swapRow.datetime,
      stringOrEmpty(swapRow.logIndex),
      swapRow.transactionHash,
      swapRow.sender,
      swapRow.tokenAmountFormatted,
      swapRow.numeraireAmountFormatted,
      stringOrEmpty(matchedReceipt?.blockNumber),
      matchedReceipt?.datetime ?? "",
      stringOrEmpty(matchedReceipt?.logIndex),
      matchedReceipt?.transactionHash ?? "",
      matchedReceipt?.buyer ?? "",
      decodedCountry,
      matchedReceipt?.tokenAmountFormatted ?? "",
      matchedReceipt?.numeraireAmountFormatted ?? ""
    ]
    await fs.appendFile(joinedCsvPath, joinedRow.map(serializeCsvValue).join(",") + "\n")
    rowsWritten++
  }

  while (!receiptResult.done) {
    enqueueReceipt(receiptMap, receiptResult.value)
    receiptResult = await receiptIterator.next()
  }

  for (const bucket of receiptMap.values()) {
    unmatchedReceiptCount += bucket.entries.length
  }
  receiptMap.clear()

  return { matchedReceiptCount, unmatchedReceiptCount, rowsWritten }
}

async function* iterateLogChunks(
  publicClient: PublicClientInstance,
  params: { address: Address; fromBlock: bigint; toBlock?: bigint; logOptions?: LogChunkOptions }
) {
  const toBlock = params.toBlock ?? (await publicClient.getBlockNumber())
  const MAX_BLOCK_RANGE = 1_000n
  let currentFrom = params.fromBlock

  while (currentFrom <= toBlock) {
    const chunkEnd =
      currentFrom + MAX_BLOCK_RANGE - 1n > toBlock ? toBlock : currentFrom + MAX_BLOCK_RANGE - 1n
    const chunkRequest = {
      address: params.address,
      fromBlock: currentFrom,
      toBlock: chunkEnd,
      ...(params.logOptions ?? {})
    } as GetLogsParameters
    const chunk = await publicClient.getLogs(chunkRequest)
    yield chunk
    currentFrom = chunkEnd + 1n
  }
}

function compareLogs(
  a: { blockNumber?: bigint; logIndex?: number },
  b: { blockNumber?: bigint; logIndex?: number }
) {
  const blockA = a.blockNumber ?? 0n
  const blockB = b.blockNumber ?? 0n
  if (blockA < blockB) return -1
  if (blockA > blockB) return 1
  const logA = a.logIndex ?? 0
  const logB = b.logIndex ?? 0
  return logA - logB
}

async function formatReceiptRow(
  receipt: ReceiptLog,
  auctionParams: AuctionParams,
  publicClient: PublicClientInstance,
  blockCache: Map<bigint, string>
): Promise<string[]> {
  const args = receipt.args
  const tokenAmountRaw = args.tokenAmount ?? 0n
  const numeraireAmountRaw = args.numeraireAmount ?? 0n
  const datetime = await getBlockDatetime(publicClient, receipt.blockNumber!, blockCache)
  return [
    stringOrEmpty(receipt.blockNumber),
    datetime,
    stringOrEmpty(receipt.logIndex),
    receipt.transactionHash,
    args.buyer ?? "",
    args.countryCode ?? "",
    formatMaybe(args.tokenAmount, auctionParams.token.decimals),
    formatMaybe(args.numeraireAmount, auctionParams.numeraire.decimals),
    String(tokenAmountRaw),
    String(numeraireAmountRaw)
  ]
}

async function formatSwapRow(
  swap: PoolSwapLog,
  auctionParams: AuctionParams,
  publicClient: PublicClientInstance,
  blockCache: Map<bigint, string>
): Promise<string[]> {
  const swapTokenRaw = auctionParams.isToken0 ? swap.args.amount0 : swap.args.amount1
  const swapNumeraireRaw = auctionParams.isToken0 ? swap.args.amount1 : swap.args.amount0
  const swapTokenAmount = swapTokenRaw
  const swapNumeraireAmount = swapNumeraireRaw
  const datetime = await getBlockDatetime(publicClient, swap.blockNumber!, blockCache)
  return [
    stringOrEmpty(swap.blockNumber),
    datetime,
    stringOrEmpty(swap.logIndex),
    swap.transactionHash,
    swap.args.sender ?? "",
    formatMaybe(swapTokenAmount, auctionParams.token.decimals),
    formatMaybe(swapNumeraireAmount, auctionParams.numeraire.decimals),
    String(swapTokenAmount),
    String(swapNumeraireAmount)
  ]
}

function enqueueReceipt(map: Map<string, ReceiptBucket>, receipt: ReceiptRow) {
  const key = matchKey(receipt.blockNumber, receipt.tokenAmountRaw)
  const bucket = map.get(key)
  if (bucket) {
    bucket.entries.push(receipt)
    return
  }
  map.set(key, { blockNumber: receipt.blockNumber, entries: [receipt] })
}

function dropReceiptsBefore(
  map: Map<string, ReceiptBucket>,
  blockThreshold: bigint,
  onDrop: (count: number) => void
) {
  for (const [key, bucket] of Array.from(map.entries())) {
    if (bucket.blockNumber < blockThreshold) {
      onDrop(bucket.entries.length)
      map.delete(key)
    }
  }
}

async function* readReceiptRows(filePath: string) {
  for await (const row of iterateCsvLines(filePath)) {
    const columns = parseCsvLine(row)
    yield {
      blockNumber: BigInt(columns[0] || "0"),
      datetime: columns[1] || "",
      logIndex: BigInt(columns[2] || "0"),
      transactionHash: columns[3] || "",
      buyer: columns[4] || "",
      countryCode: columns[5] || "",
      tokenAmountFormatted: columns[6] || "",
      numeraireAmountFormatted: columns[7] || "",
      tokenAmountRaw: BigInt(columns[8] || "0"),
      numeraireAmountRaw: BigInt(columns[9] || "0")
    }
  }
}

async function* readSwapRows(filePath: string) {
  for await (const row of iterateCsvLines(filePath)) {
    const columns = parseCsvLine(row)
    yield {
      blockNumber: BigInt(columns[0] || "0"),
      datetime: columns[1] || "",
      logIndex: BigInt(columns[2] || "0"),
      transactionHash: columns[3] || "",
      sender: columns[4] || "",
      tokenAmountFormatted: columns[5] || "",
      numeraireAmountFormatted: columns[6] || "",
      tokenAmountRaw: BigInt(columns[7] || "0"),
      numeraireAmountRaw: BigInt(columns[8] || "0")
    }
  }
}

async function* iterateCsvLines(filePath: string) {
  const stream = createReadStream(filePath, { encoding: "utf-8" })
  const reader = readline.createInterface({ input: stream, crlfDelay: Infinity })
  let isFirst = true
  for await (const line of reader) {
    if (isFirst) {
      isFirst = false
      continue
    }
    if (!line) continue
    yield line
  }
}

function parseCsvLine(line: string) {
  const values: string[] = []
  let current = ""
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        current += char
      }
    } else if (char === '"') {
      inQuotes = true
    } else if (char === ",") {
      values.push(current)
      current = ""
    } else {
      current += char
    }
  }
  values.push(current)
  return values
}

async function writeCsvHeader(filePath: string, header: string[]) {
  await fs.writeFile(filePath, header.map(serializeCsvValue).join(",") + "\n")
}

async function appendCsvRows(filePath: string, rows: string[][]) {
  const lines = rows.map(row => row.map(serializeCsvValue).join(",")).join("\n")
  await fs.appendFile(filePath, lines + "\n")
}

async function ensureCsvExists(filePath: string) {
  try {
    await fs.access(filePath)
  } catch (error) {
    throw new Error(
      `Expected existing CSV at ${filePath} (use --use-existing-csv to skip fetching). ${error}`
    )
  }
}

function serializeCsvValue(value: string | undefined) {
  const normalized = value ?? ""
  if (normalized.includes(",") || normalized.includes("\n") || normalized.includes('"')) {
    return `"${normalized.replace(/"/g, '""')}"`
  }
  return normalized
}

function stringOrEmpty(value: bigint | number | string | undefined) {
  if (value === undefined) return ""
  return String(value)
}

function formatMaybe(value: bigint | undefined, decimals: number) {
  if (value === undefined) return ""
  return formatUnits(value, decimals)
}

function matchKey(blockNumber: bigint | undefined, amount: bigint | undefined) {
  return `${blockNumber ?? 0n}-${amount ?? 0n}`
}

function decodeCountryCode(raw?: string) {
  if (!raw) return ""
  if (!raw.startsWith("0x")) return raw
  return COUNTRY_CODE_HASHES.get(raw.toLowerCase()) ?? raw
}

async function getBlockDatetime(
  publicClient: PublicClientInstance,
  blockNumber: bigint,
  cache: Map<bigint, string>
): Promise<string> {
  const cached = cache.get(blockNumber)
  if (cached) return cached

  const block = await publicClient.getBlock({ blockNumber })
  const datetime = new Date(Number(block.timestamp) * 1000).toISOString()
  cache.set(blockNumber, datetime)
  return datetime
}
