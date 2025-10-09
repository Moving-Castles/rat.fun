import { defineCliConfig } from "sanity/cli"

export default defineCliConfig({
  api: {
    projectId: "saljmqwt",
    dataset: "production"
  },
  deployment: {
    appId: "dl413j7l28itnhz1f9g3rxwo",
    autoUpdates: false
  },
  studioHost: "rat-room-public"
})
