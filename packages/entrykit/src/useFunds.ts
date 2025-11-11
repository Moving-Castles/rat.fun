import { Address, Chain, Client, Transport } from "viem"
import { Config, useClient, useConfig } from "wagmi"
import { getBalanceQueryOptions } from "wagmi/query"
import { QueryClient, queryOptions, useQuery, useQueryClient } from "@tanstack/react-query"
import { useEntryKitConfig } from "./EntryKitConfigProvider"
import { getSessionAccountQueryOptions } from "./useSessionAccount"

export function getFundsQueryOptions({
  queryClient,
  config,
  client,
  userAddress
}: {
  queryClient: QueryClient
  config: Config
  client: Client<Transport, Chain> | undefined
  userAddress: Address | undefined
}) {
  return queryOptions({
    queryKey: ["getFunds", client?.uid, userAddress],
    queryFn: async () => {
      if (!client) throw new Error("Viem client not ready.")
      if (!userAddress) throw new Error("User not connected.")

      const {
        account: { address: sessionAddress }
      } = await queryClient.fetchQuery(getSessionAccountQueryOptions({ client, userAddress }))

      const sessionBalance = await queryClient.fetchQuery(
        getBalanceQueryOptions(config, { chainId: client.chain.id, address: sessionAddress })
      )

      return {
        sessionBalance: sessionBalance?.value ?? null
      }
    },
    retry: false
  })
}

export function useFunds(userAddress: Address | undefined) {
  const queryClient = useQueryClient()
  const config = useConfig()
  const { chainId } = useEntryKitConfig()
  const client = useClient({ chainId })

  return useQuery(getFundsQueryOptions({ queryClient, config, client, userAddress }), queryClient)
}
