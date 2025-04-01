import { MessageParam } from '@anthropic-ai/sdk/resources';
import { Rat, Room } from '@routes/room/enter/types'
import { LogEntry, OutcomeReturnValue } from './types';

export function constructEventMessages(
    rat: Rat,
    room: Room,
): MessageParam[] {
    const messages: MessageParam[] = [];
    // Room
    messages.push({ role: "user", content: `RoomDescription: ${room.name}. ${room.prompt}` });
    messages.push({ role: "user", content: `RoomBalance: ${room.balance}` });
    // Rat
    messages.push({ role: "user", content: `RatName: ${rat.name}` });
    messages.push({ role: "user", content: `RatTraits: ${JSON.stringify(rat.traits)}` });
    messages.push({ role: "user", content: `RatItems: ${JSON.stringify(rat.inventory)}` });
    messages.push({ role: "user", content: `RatStats: ${JSON.stringify(rat.stats)}` });
    messages.push({ role: "user", content: `RatBalance: ${rat.balance}` });
    return messages;
}

export function constructCorrectionMessages(
    unvalidatedOutcome: OutcomeReturnValue,
    validatedOutcome: OutcomeReturnValue,
    events: LogEntry[]
): MessageParam[] {
    const messages: MessageParam[] = [];
    // Unvalidated outcome
    messages.push({ role: "user", content: `OldOutcome: ${JSON.stringify(unvalidatedOutcome)}` });
    // Validated outcome
    messages.push({ role: "user", content: `ValidatedOutcome: ${JSON.stringify(validatedOutcome)}` });
    // Event log
    messages.push({ role: "user", content: `Eventlog: ${JSON.stringify(events)}` });
    return messages;
}