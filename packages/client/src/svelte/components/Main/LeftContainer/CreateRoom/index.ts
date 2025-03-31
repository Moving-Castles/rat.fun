import type { ServerReturnValue } from "@svelte/components/Main/RightContainer/RoomResult/types"
import { SetupWalletNetworkResult } from "@mud/setupWalletNetwork";

import { ENVIRONMENT } from "@mud/enums"
import { MESSAGE } from "@svelte/components/Main/RightContainer/RoomResult/constants"

export async function createRoom(environment: ENVIRONMENT, walletNetwork: SetupWalletNetworkResult, roomName: string, roomPrompt: string ) {
    const startTime = performance.now()

    const url = 
    [ENVIRONMENT.PYROPE, ENVIRONMENT.GARNET].includes(environment) 
        ? "https://reality-model-1.mc-infra.com/room/create" 
        : "http://localhost:3131/room/create"

    const signature = await walletNetwork.walletClient.signMessage({
      message: MESSAGE,
    })

    const formData = new URLSearchParams()
    formData.append("signature", signature)
    formData.append("roomName", roomName)
    formData.append("roomPrompt", roomPrompt)

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

      const result = (await response.json()) as ServerReturnValue

      console.log('result', result)

      const endTime = performance.now()

      console.log(
        `Operation took ${(endTime - startTime).toFixed(3)} milliseconds`
      )

      return result
    } catch (err) {
      console.log(err)
      window.alert("An error occurred. Please try again.")
      return undefined
    }
}