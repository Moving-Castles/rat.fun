// ICONS
import { MdList, MdRoom, MdChecklist, MdStar } from "react-icons/md"

export default (S: any) =>
    S.list()
        .title("Rat Room")
        .items([
            S.listItem()
            .title("Active prompts")
            .icon(MdChecklist)
            .child(
                S.editor()
                    .id('active-prompts')
                    .schemaType("activePrompts")
                    .documentId("active-prompts")
            ),
            S.listItem()
            .title("Prompts")
            .icon(MdList)
            .child(
                S.documentList()
                    .title('Prompts')
                    .filter('_type == "prompt"')
                    .schemaType("prompt")
            ),
            S.divider(),
            S.listItem()
            .title("Rooms")
            .icon(MdRoom)
            .child(
                S.documentList()
                    .title('Rooms')
                    .filter('_type == "room"')
                    .schemaType("room")
            ),
            S.divider(),
            S.listItem()
            .title("Outcomes")
            .icon(MdStar)
            .child(
                S.documentList()
                    .title('Outcomes')
                    .filter('_type == "outcome"')
                    .schemaType("outcome")
            ),
        ]);