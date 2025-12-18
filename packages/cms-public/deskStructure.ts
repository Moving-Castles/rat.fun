// ICONS
import {
  MdAirlines,
  MdStar,
  MdAutoGraph,
  MdEvent,
  MdChat,
  MdFolder,
  MdList,
  MdFlag
} from "react-icons/md"

export default (S: any, context: any) =>
  S.list()
    .title("Rat Trip Public")
    .items([
      S.listItem()
        .title("Trips")
        .icon(MdAirlines)
        .child(async () => {
          const client = context.getClient({ apiVersion: "2023-01-01" })
          const results = await client.fetch(
            '*[_type == "trip"] { "address": worldAddress } | order(address asc)'
          )
          const uniqueAddresses = [
            ...new Set(results.map((r: any) => r.address).filter(Boolean))
          ] as string[]

          return S.list()
            .title("Trips by World")
            .items([
              S.listItem()
                .title("All Trips")
                .child(
                  S.documentList()
                    .title("All Trips")
                    .filter('_type == "trip"')
                    .defaultOrdering([{ field: "_createdAt", direction: "desc" }])
                ),
              S.divider(),
              ...uniqueAddresses.map((address: string) =>
                S.listItem()
                  .title(address)
                  .id(`trip-world-${address}`)
                  .child(
                    S.documentList()
                      .title(`${address} - Trips`)
                      .filter('_type == "trip" && worldAddress == $worldAddress')
                      .params({ worldAddress: address })
                      .defaultOrdering([{ field: "_createdAt", direction: "desc" }])
                  )
              )
            ])
        }),
      S.divider(),
      S.listItem()
        .title("Outcomes")
        .icon(MdStar)
        .child(async () => {
          const client = context.getClient({ apiVersion: "2023-01-01" })
          const results = await client.fetch(
            '*[_type == "outcome"] { "address": worldAddress } | order(address asc)'
          )
          const uniqueAddresses = [
            ...new Set(results.map((r: any) => r.address).filter(Boolean))
          ] as string[]

          return S.list()
            .title("Outcomes by World")
            .items([
              S.listItem()
                .title("All Outcomes")
                .child(
                  S.documentList()
                    .title("All Outcomes")
                    .filter('_type == "outcome"')
                    .defaultOrdering([{ field: "_createdAt", direction: "desc" }])
                ),
              S.divider(),
              ...uniqueAddresses.map((address: string) =>
                S.listItem()
                  .title(address)
                  .id(`outcome-world-${address}`)
                  .child(
                    S.documentList()
                      .title(`${address} - Outcomes`)
                      .filter('_type == "outcome" && worldAddress == $worldAddress')
                      .params({ worldAddress: address })
                      .defaultOrdering([{ field: "_createdAt", direction: "desc" }])
                  )
              )
            ])
        }),
      S.divider(),
      S.listItem()
        .title("Trip Folders")
        .icon(MdFolder)
        .child(
          S.documentList()
            .title("Trip Folders")
            .filter('_type == "tripFolder"')
            .schemaType("tripFolder")
        ),
      S.listItem()
        .title("Trip Folder List")
        .icon(MdList)
        .child(
          S.editor()
            .id("trip-folder-list")
            .schemaType("tripFolderList")
            .documentId("trip-folder-list")
        ),
      S.listItem()
        .title("Challenge")
        .icon(MdFlag)
        .child(S.editor().id("challenge").schemaType("challenge").documentId("challenge")),
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
