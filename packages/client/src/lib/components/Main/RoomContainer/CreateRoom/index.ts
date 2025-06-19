import type {
  EnterRoomReturnValue,
  CreateRoomReturnValue,
} from "@server/modules/types"
import { SetupWalletNetworkResult } from "$lib/mud/setupWalletNetwork"

import { ENVIRONMENT } from "$lib/mud/enums"
import { OFFCHAIN_VALIDATION_MESSAGE } from "@server/config"

export async function createRoom(
  environment: ENVIRONMENT,
  walletNetwork: SetupWalletNetworkResult,
  roomPrompt: string,
  levelId: string
): Promise<CreateRoomReturnValue> {
  const startTime = performance.now()

  const url = [ENVIRONMENT.PYROPE ].includes(environment)
    ? "https://reality-model-1.mc-infra.com/room/create"
    : "http://localhost:3131/room/create"

  const signature = await walletNetwork.walletClient.signMessage({
    message: OFFCHAIN_VALIDATION_MESSAGE,
  })

  const formData = new URLSearchParams()
  formData.append("signature", signature)
  formData.append("roomPrompt", roomPrompt)
  formData.append("levelId", levelId)

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
      const error = await response.json()
      console.log("error", error)
      throw new Error(`${error.error}: ${error.message}`)
    }

    const result = (await response.json()) as EnterRoomReturnValue

    console.log("result", result)

    const endTime = performance.now()

    console.log(
      `Operation took ${(endTime - startTime).toFixed(3)} milliseconds`
    )

    return result
  } catch (err) {
    console.error(err)
    window.alert(`SERVER ERROR: ${err}`)
    return null
  }
}
