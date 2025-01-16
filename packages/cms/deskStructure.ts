// ICONS
import { MdMap } from "react-icons/md"

export default (S: any) =>
    S.list()
        .title("Rat Room")
        .items([
            S.listItem()
                .title("World prompts")
                .icon(MdMap)
                .child(
                    S.editor()
                        .id('world-prompts')
                        .schemaType("worldPrompts")
                        .documentId("worldPrompts")
                )
        ]);