import type { ServerReturnValue, ServerReturnValuePvP } from "@components/Room/types"
import { SetupWalletNetworkResult } from "@mud/setupWalletNetwork";

import { ENVIRONMENT } from "@mud/enums"
import { MESSAGE } from "@components/Room/constants"
import { ROOM_TYPE } from "contracts/enums"

export async function enterRoom(environment: ENVIRONMENT, walletNetwork: SetupWalletNetworkResult, roomType: ROOM_TYPE, roomId: string, ratId: string ) {
    const startTime = performance.now()

    const baseUrl = 
    [ENVIRONMENT.GARNET].includes(environment) 
        ? "https://reality-model-1.mc-infra.com/room/" 
        : "http://localhost:3131/room/"
    const url = baseUrl + (roomType === ROOM_TYPE.ONE_PLAYER ? "enter" : "enter-pvp")

    const signature = await walletNetwork.walletClient.signMessage({
      message: MESSAGE,
    })

    const formData = new URLSearchParams()
    formData.append("signature", signature)
    formData.append("roomId", roomId)
    formData.append("ratId", ratId)

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Network response was not ok")
      }

      const outcome = (await response.json()) as ServerReturnValue

      console.log('outcome', outcome)

      const endTime = performance.now()

      console.log(
        `Operation took ${(endTime - startTime).toFixed(3)} milliseconds`
      )

      return outcome
    } catch (err) {
      console.log(err)
      window.alert("An error occurred. Please try again.")
      return undefined
    }
  }