// ICONS
import { MdList, MdGavel } from "react-icons/md"

export default (S: any) =>
    S.list()
        .title("Rat Room")
        .items([
            S.listItem()
            .title("Combined prompts")
            .icon(MdList)
            .child(
                S.editor()
                    .id('combined-prompts')
                    .schemaType("combinedPrompts")
                    .documentId("combined-prompts")
            ),
            S.listItem()
            .title("Correction prompts")
            .icon(MdGavel)
            .child( 
                S.editor()
                    .id('correction-prompts')
                    .schemaType("correctionPrompts")
                    .documentId("correction-prompts")
            )
        ]);