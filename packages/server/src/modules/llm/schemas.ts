import { z } from "zod"

/**
 * Zod schemas for validating LLM responses
 *
 * These schemas validate the JSON structure returned by the LLM.
 * They use coercion where appropriate to handle common LLM quirks
 * (e.g., returning "100" instead of 100).
 */

// * * * * * * * * * * * * * * * * * *
// Shared schemas
// * * * * * * * * * * * * * * * * * *

export const LogEntrySchema = z.object({
  timestamp: z.string(),
  event: z.string()
})

// * * * * * * * * * * * * * * * * * *
// Event model schemas
// * * * * * * * * * * * * * * * * * *

export const ItemChangeSchema = z
  .object({
    logStep: z.coerce.number(),
    type: z.enum(["add", "remove"]),
    name: z.string(),
    value: z.coerce.number(),
    id: z.string().optional()
  })
  .refine(data => data.type !== "remove" || data.id !== undefined, {
    message: "id is required when type is 'remove'",
    path: ["id"]
  })

export const BalanceTransferSchema = z.object({
  logStep: z.coerce.number(),
  amount: z.coerce.number()
})

export const DebuggingInfoSchema = z
  .object({
    internalText: z.string().default("No debugging info provided"),
    randomSeed: z.coerce.number().default(666)
  })
  .default({ internalText: "No debugging info provided", randomSeed: 666 })

export const OutcomeReturnValueSchema = z.object({
  id: z.string().optional(),
  itemChanges: z.array(ItemChangeSchema).default([]),
  balanceTransfers: z.array(BalanceTransferSchema).default([]),
  debuggingInfo: DebuggingInfoSchema
})

export const EventsReturnValueSchema = z.object({
  log: z.array(LogEntrySchema).min(1, "log must have at least one entry"),
  outcome: OutcomeReturnValueSchema
})

// * * * * * * * * * * * * * * * * * *
// Correction model schemas
// * * * * * * * * * * * * * * * * * *

export const CorrectionReturnValueSchema = z.object({
  log: z.array(LogEntrySchema).min(1, "log must have at least one entry")
})

// * * * * * * * * * * * * * * * * * *
// Type exports (inferred from schemas)
// * * * * * * * * * * * * * * * * * *

export type LogEntryParsed = z.infer<typeof LogEntrySchema>
export type ItemChangeParsed = z.infer<typeof ItemChangeSchema>
export type BalanceTransferParsed = z.infer<typeof BalanceTransferSchema>
export type DebuggingInfoParsed = z.infer<typeof DebuggingInfoSchema>
export type OutcomeReturnValueParsed = z.infer<typeof OutcomeReturnValueSchema>
export type EventsReturnValueParsed = z.infer<typeof EventsReturnValueSchema>
export type CorrectionReturnValueParsed = z.infer<typeof CorrectionReturnValueSchema>
