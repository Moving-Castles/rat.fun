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
    events: EventsReturnValue,
    rat: Rat
): MessageParam[] {
    const messages: MessageParam[] = [];
    console.log('rat', rat)
    messages.push({ role: "user", content: `Eventlog: ${JSON.stringify(events.log)}` });
    messages.push({ role: "user", content: `Rat: ${rat.prompt}` });
    messages.push({ role: "user", content: `RatStats: ${JSON.stringify(rat.stats)}` });
    return messages;
}