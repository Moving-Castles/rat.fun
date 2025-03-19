import { SetupWalletNetworkResult } from "@mud/setupWalletNetwork";

import { ENVIRONMENT } from "@mud/enums"
import { MESSAGE } from "@components/Room/constants"

export async function sendChat(environment: ENVIRONMENT, walletNetwork: SetupWalletNetworkResult, message: string, ratId: string ) {
    const startTime = performance.now()

    const url = 
    [ENVIRONMENT.GARNET].includes(environment) 
        ? "https://reality-model-1.mc-infra.com/chat/" 
        : "http://localhost:3131/chat/"

    const signature = await walletNetwork.walletClient.signMessage({
      message: MESSAGE,
    })

    console.log(signature)
    console.log(message)
    console.log(ratId)

    const formData = new URLSearchParams()
    formData.append("signature", signature)
    formData.append("message", message)
    formData.append("ratId", ratId)

    console.log(formData)

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

      console.log(response)
      const message = await response.text()

      console.log('message', message)

      const endTime = performance.now()

      console.log(
        `Operation took ${(endTime - startTime).toFixed(3)} milliseconds`
      )

      return message
    } catch (err) {
      console.log(err)
      window.alert("An error occurred. Please try again.")
      return undefined
    }
  }