import { defineCliConfig } from "sanity/cli"

export default defineCliConfig({
  api: {
    projectId: "lviejo4k",
    dataset: "production"
  },
  deployment: { appId: "xa0awgkhl8ae6m6we4oviodz", autoUpdates: false },
  studioHost: "rat-room-private"
})
