import { MessageParam } from '@anthropic-ai/sdk/resources';
import { Rat, Room } from '@routes/room/enter/types'
import { EventsReturnValue, OutcomeReturnValue, PvPOutcomeReturnValue } from './types';

// One player

export function constructEventMessages(
    rat: Rat,
    room: Room,
): MessageParam[] {
    const messages: MessageParam[] = [];
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

export function constructOutcomeMessages(
    rat: Rat,
    room: Room,
    events: EventsReturnValue
): MessageParam[] {
    const messages: MessageParam[] = [];
    // Room
    messages.push({ role: "user", content: `RoomDescription: ${room.prompt}` });
    messages.push({ role: "user", content: `RoomBalance: ${room.balance}` });
    // Rat
    messages.push({ role: "user", content: `RatName: ${rat.name}` });
    messages.push({ role: "user", content: `RatTraits: ${JSON.stringify(rat.traits)}` });
    messages.push({ role: "user", content: `RatItems: ${JSON.stringify(rat.inventory)}` });
    messages.push({ role: "user", content: `RatStats: ${JSON.stringify(rat.stats)}` });
    messages.push({ role: "user", content: `RatBalance: ${rat.balance}` });
    // Event log
    messages.push({ role: "user", content: `Eventlog: ${JSON.stringify(events)}` });
    return messages;
}

export function constructCorrectionMessages(
    unvalidatedOutcome: OutcomeReturnValue,
    validatedOutcome: OutcomeReturnValue,
    events: EventsReturnValue
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

// Two player

export function constructPvPEventMessages(
    ratA: Rat,
    ratB: Rat,
    room: Room,
): MessageParam[] {
    const messages: MessageParam[] = [];
    // Room
    messages.push({ role: "user", content: `RoomDescription: ${room.prompt}` });
    messages.push({ role: "user", content: `RoomBalance: ${room.balance}` });
    // Rat A
    messages.push({ role: "user", content: `A: RatName: ${ratA.name}` });
    messages.push({ role: "user", content: `A: RatTraits: ${JSON.stringify(ratA.traits)}` });
    messages.push({ role: "user", content: `A: RatItems: ${JSON.stringify(ratA.inventory)}` });
    messages.push({ role: "user", content: `A: RatStats: ${JSON.stringify(ratA.stats)}` });
    messages.push({ role: "user", content: `A: RatBalance: ${ratA.balance}` });
    // Rat B
    messages.push({ role: "user", content: `B: RatName: ${ratB.name}` });
    messages.push({ role: "user", content: `B: RatTraits: ${JSON.stringify(ratB.traits)}` });
    messages.push({ role: "user", content: `B: RatItems: ${JSON.stringify(ratB.inventory)}` });
    messages.push({ role: "user", content: `B: RatStats: ${JSON.stringify(ratB.stats)}` });
    messages.push({ role: "user", content: `B: RatBalance: ${ratB.balance}` });
    return messages;
}

export function constructPvPOutcomeMessages(
    ratA: Rat,
    ratB: Rat,
    room: Room,
    events: EventsReturnValue
): MessageParam[] {
    const messages: MessageParam[] = [];
    // Room
    messages.push({ role: "user", content: `RoomDescription: ${room.prompt}` });
    messages.push({ role: "user", content: `RoomBalance: ${room.balance}` });
    // Rat A
    messages.push({ role: "user", content: `A: RatName: ${ratA.name}` });
    messages.push({ role: "user", content: `A: RatTraits: ${JSON.stringify(ratA.traits)}` });
    messages.push({ role: "user", content: `A: RatItems: ${JSON.stringify(ratA.inventory)}` });
    messages.push({ role: "user", content: `A: RatStats: ${JSON.stringify(ratA.stats)}` });
    messages.push({ role: "user", content: `A: RatBalance: ${ratA.balance}` });
    // Rat B
    messages.push({ role: "user", content: `B: RatName: ${ratB.name}` });
    messages.push({ role: "user", content: `B: RatTraits: ${JSON.stringify(ratB.traits)}` });
    messages.push({ role: "user", content: `B: RatItems: ${JSON.stringify(ratB.inventory)}` });
    messages.push({ role: "user", content: `B: RatStats: ${JSON.stringify(ratB.stats)}` });
    messages.push({ role: "user", content: `B: RatBalance: ${ratB.balance}` });
    // Event log
    messages.push({ role: "user", content: `Eventlog: ${JSON.stringify(events)}` });
    return messages;
}

export function constructPvPCorrectionMessages(
    unvalidatedOutcome: PvPOutcomeReturnValue,
    validatedOutcome: PvPOutcomeReturnValue,
    events: EventsReturnValue
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

// Chat

export function constructChatMessages(
    message: string,
    rat: Rat,
): MessageParam[] {
    const messages: MessageParam[] = [];
    messages.push({ role: "user", content: `Message: ${message}` });
    messages.push({ role: "user", content: `RatName: ${rat.name}` });
    messages.push({ role: "user", content: `RatTraits: ${JSON.stringify(rat.traits)}` });
    messages.push({ role: "user", content: `RatItems: ${JSON.stringify(rat.inventory)}` });
    messages.push({ role: "user", content: `RatStats: ${JSON.stringify(rat.stats)}` });
    messages.push({ role: "user", content: `RatBalance: ${rat.balance}` });
    return messages;
}