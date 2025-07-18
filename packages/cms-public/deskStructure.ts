// ICONS
import { MdRoom, MdStar, MdImage } from "react-icons/md"

export default (S: any) =>
  S.list()
    .title("Rat Room Public")
    .items([
      S.listItem()
        .title("Rooms")
        .icon(MdRoom)
        .child(S.documentList().title("Rooms").filter('_type == "room"').schemaType("room")),
      S.divider(),
      S.listItem()
        .title("Outcomes")
        .icon(MdStar)
        .child(
          S.documentList().title("Outcomes").filter('_type == "outcome"').schemaType("outcome")
        ),
      S.divider(),
      S.listItem()
        .title("Template images")
        .icon(MdImage)
        .child(
          S.editor()
            .id("template-images")
            .schemaType("templateImages")
            .documentId("template-images")
        )
    ])
