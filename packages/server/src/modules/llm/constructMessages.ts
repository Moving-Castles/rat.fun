import { MessageParam } from '@anthropic-ai/sdk/resources';
import { Level, Rat, Room } from '@modules/types'
import { LogEntry, OutcomeReturnValue } from '@modules/types';

export function constructEventMessages(
    rat: Rat,
    room: Room,
    level: Level
): MessageParam[] {
    const messages: MessageParam[] = [];
    // Level / floor
    messages.push({ role: "user", content: `FloorDescription: ${level.prompt}` });
    // Room
    messages.push({ role: "user", content: `RoomDescription: ${room.prompt}` });
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