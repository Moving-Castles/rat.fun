// ICONS
import { MdAirlines, MdStar, MdAutoGraph, MdEvent, MdChat } from "react-icons/md"

export default (S: any) =>
  S.list()
    .title("Rat Trip Public")
    .items([
      S.listItem()
        .title("Trips")
        .icon(MdAirlines)
        .child(S.documentList().title("Trips").filter('_type == "trip"').schemaType("trip")),
      S.divider(),
      S.listItem()
        .title("Outcomes")
        .icon(MdStar)
        .child(
          S.documentList().title("Outcomes").filter('_type == "outcome"').schemaType("outcome")
        ),
      S.divider(),
      S.listItem()
        .title("World Events")
        .icon(MdEvent)
        .child(
          S.documentList()
            .title("World Events")
            .filter('_type == "worldEvent"')
            .schemaType("worldEvent")
        ),
      S.divider(),
      S.listItem()
        .title("Rat images")
        .icon(MdChat)
        .child(S.editor().id("rat-images").schemaType("ratImages").documentId("rat-images")),
      S.divider(),
      S.listItem()
        .title("Statistics")
        .icon(MdAutoGraph)
        .child(
          S.documentList()
            .title("Statistics")
            .filter('_type == "statistics"')
            .schemaType("statistics")
        )
    ])
