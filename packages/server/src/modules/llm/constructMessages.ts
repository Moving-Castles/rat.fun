import { MessageParam } from '@anthropic-ai/sdk/resources';
import { Rat, Room } from '@routes/room/enter/types'
import { EventsReturnValue } from './types';

export function constructEventMessages(
    room: Room,
    rat: Rat
): MessageParam[] {
    const messages: MessageParam[] = [];
    messages.push({ role: "user", content: `Room: ${room.prompt}` });
    messages.push({ role: "user", content: `Rat: ${rat.prompt}` });
    messages.push({ role: "user", content: `RatStats: ${JSON.stringify(rat.stats)}` });
    return messages;
}

export function constructOutcomeMessages(
    room: Room,
    rat: Rat,
    events: EventsReturnValue
): MessageParam[] {
    const messages: MessageParam[] = [];
    console.log('rat', rat)
    messages.push({ role: "user", content: `Room: ${room.prompt}` });
    messages.push({ role: "user", content: `RatTraits: ${JSON.stringify(rat.traits)}` });
    messages.push({ role: "user", content: `RatItems: ${JSON.stringify(rat.loadOut)}` });
    messages.push({ role: "user", content: `RatStats: ${JSON.stringify(rat.stats)}` });
    messages.push({ role: "user", content: `Eventlog: ${JSON.stringify(events.log)}` });
    return messages;
}