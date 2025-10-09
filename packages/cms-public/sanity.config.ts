import { defineConfig } from "sanity"
import { structureTool } from "sanity/structure"
import { visionTool } from "@sanity/vision"
import { schemaTypes } from "./schemaTypes"
import deskStructure from "./deskStructure"

export default defineConfig({
  name: "default",
  title: "rat.fun public",

  projectId: "saljmqwt",
  dataset: "production",

  plugins: [structureTool({ structure: deskStructure }), visionTool()],

  document: {
    newDocumentOptions: (prev, { creationContext }) => {
      const { type } = creationContext
      const DISABLED_TYPES = ["trip", "outcome", "worldEvent", "templateImages"]
      if (type === "global") {
        return prev.filter(template => !DISABLED_TYPES.includes(template.templateId))
      }
      return prev
    }
  },
  schema: {
    types: schemaTypes
  }
})
