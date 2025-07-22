// ICONS
import { MdList, MdChecklist, MdScience } from "react-icons/md"

export default (S: any) =>
  S.list()
    .title("Rat Room Private")
    .items([
      S.listItem()
        .title("Active prompts")
        .icon(MdChecklist)
        .child(
          S.editor().id("active-prompts").schemaType("activePrompts").documentId("active-prompts")
        ),
      S.listItem()
        .title("Test prompts")
        .icon(MdScience)
        .child(S.editor().id("test-prompts").schemaType("testPrompts").documentId("test-prompts")),
      S.listItem()
        .title("Prompts")
        .icon(MdList)
        .child(S.documentList().title("Prompts").filter('_type == "prompt"').schemaType("prompt"))
    ])
