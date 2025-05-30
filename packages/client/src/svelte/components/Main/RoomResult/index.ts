import type { EnterRoomReturnValue } from "@server/modules/types"
import { SetupWalletNetworkResult } from "@mud/setupWalletNetwork";

import { ENVIRONMENT } from "@mud/enums"
import { OFFCHAIN_VALIDATION_MESSAGE } from "@server/config";

export async function enterRoom(
  environment: ENVIRONMENT,
  walletNetwork: SetupWalletNetworkResult,
  roomId: string,
  ratId: string
) {
  const startTime = performance.now()

  const url = [ENVIRONMENT.PYROPE, ENVIRONMENT.GARNET].includes(environment)
    ? "https://reality-model-1.mc-infra.com/room/enter"
    : "http://localhost:3131/room/enter"

  const signature = await walletNetwork.walletClient.signMessage({
    message: OFFCHAIN_VALIDATION_MESSAGE,
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
      console.log("response", response)
      const error = (await response.json())
      console.log("error", error)
      throw new Error(`${error.error}: ${error.message}`)
    }

    const outcome = (await response.json()) as EnterRoomReturnValue

    console.log("outcome", outcome)

    const endTime = performance.now()

    console.log(
      `Operation took ${(endTime - startTime).toFixed(3)} milliseconds`
    )

    return outcome
  } catch (err) {
    console.error(err)
    window.alert(`SERVER ERROR: ${err}`)
    return null
  }
}
