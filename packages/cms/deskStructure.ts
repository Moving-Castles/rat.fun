// ICONS
import { MdList, MdGavel, MdAccessAlarm, MdChat } from "react-icons/md"

export default (S: any) =>
    S.list()
        .title("Rat Room")
        .items([
            S.listItem()
                .title("Event prompts")
                .icon(MdList)
                .child(
                    S.editor()
                        .id('event-prompts')
                        .schemaType("eventPrompts")
                        .documentId("event-prompts")
            ),
            S.listItem()
                .title("Outcome prompts")
                .icon(MdGavel)
                .child(
                    S.editor()
                        .id('outcome-prompts')
                        .schemaType("outcomePrompts")
                        .documentId("outcome-prompts")
            ),
            S.listItem()
            .title("Correction prompts")
            .icon(MdAccessAlarm)
            .child( 
                S.editor()
                    .id('correction-prompts')
                    .schemaType("correctionPrompts")
                    .documentId("correction-prompts")
            ),
            S.listItem()
            .title("Combined prompts")
            .icon(MdAccessAlarm)
            .child(
                S.editor()
                    .id('combined-prompts')
                    .schemaType("combinedPrompts")
                    .documentId("combined-prompts")
            ),
            S.divider(),
            S.listItem()
            .title("Chat prompts")
            .icon(MdChat)
            .child(
                S.editor()
                    .id('chat-prompts')
                    .schemaType("chatPrompts")
                    .documentId("chat-prompts")
            ),
            S.divider(),
            S.listItem()
            .title("(PVP) Event prompts")
            .icon(MdList)
            .child(
                S.editor()
                    .id('pvp-event-prompts')
                    .schemaType("pvpEventPrompts")
                    .documentId("pvp-event-prompts")
            ),
            S.listItem()
                .title("(PVP) Outcome prompts")
                .icon(MdGavel)
                .child(
                    S.editor()
                        .id('pvp-outcome-prompts')
                        .schemaType("pvpOutcomePrompts")
                        .documentId("pvp-outcome-prompts")
            ),
            S.listItem()
            .title("(PVP) Correction prompts")
            .icon(MdAccessAlarm)
            .child(
                S.editor()
                    .id('pvp-correction-prompts')
                    .schemaType("pvpCorrectionPrompts")
                    .documentId("pvp-correction-prompts")
            )
        ]);