export default {
  title: "Outcome",
  name: "outcome",
  type: "document",
  fields: [
    {
      title: "Title",
      name: "title",
      type: "string",
      readOnly: true,
      validation: (Rule: any) => Rule.required()
    },
    {
      title: "World address",
      name: "worldAddress",
      type: "string",
      readOnly: true,
      validation: (Rule: any) => Rule.required()
    },
    {
      title: "Player ID",
      name: "playerId",
      type: "string",
      readOnly: true,
      validation: (Rule: any) => Rule.required()
    },
    {
      title: "Player name",
      name: "playerName",
      type: "string",
      readOnly: true,
      validation: (Rule: any) => Rule.required()
    },
    {
      title: "Room ID",
      name: "roomId",
      type: "string",
      readOnly: true,
      validation: (Rule: any) => Rule.required()
    },
    {
      title: "Room Index",
      name: "roomIndex",
      type: "number",
      readOnly: true,
      validation: (Rule: any) => Rule.required()
    },
    {
      title: "Rat ID",
      name: "ratId",
      type: "string",
      readOnly: true,
      validation: (Rule: any) => Rule.required()
    },
    {
      title: "Rat Name",
      name: "ratName",
      type: "string",
      readOnly: true,
      validation: (Rule: any) => Rule.required()
    },
    {
      title: "Log",
      name: "log",
      type: "array",
      readOnly: true,
      of: [
        {
          type: "object",
          preview: {
            select: {
              timestamp: "timestamp",
              event: "event"
            },
            prepare: ({ timestamp, event }: { timestamp: string; event: string }) => ({
              title: `${timestamp} => ${event}`
            })
          },
          fields: [
            { type: "string", name: "timestamp" },
            { type: "string", name: "event" }
          ]
        }
      ]
    },
    {
      title: "Balance transfer",
      name: "balanceTransfer",
      type: "object",
      readOnly: true,
      fields: [
        { type: "number", name: "logStep" },
        { type: "number", name: "amount" }
      ]
    },
    {
      title: "Item changes",
      name: "itemChanges",
      type: "array",
      readOnly: true,
      of: [
        {
          type: "object",
          fields: [
            { type: "string", name: "name" },
            { type: "number", name: "logStep" },
            { type: "string", name: "type" },
            { type: "number", name: "value" },
            { type: "string", name: "id" }
          ]
        }
      ]
    },
    {
      title: "Room value",
      name: "roomValue",
      type: "number",
      readOnly: true,
      validation: (Rule: any) => Rule.required()
    },
    {
      title: "Room value change",
      name: "roomValueChange",
      type: "number",
      readOnly: true,
      validation: (Rule: any) => Rule.required()
    },
    {
      title: "Rat value",
      name: "ratValue",
      type: "number",
      readOnly: true,
      validation: (Rule: any) => Rule.required()
    },
    {
      title: "Rat value change",
      name: "ratValueChange",
      type: "number",
      readOnly: true,
      validation: (Rule: any) => Rule.required()
    },
    {
      title: "Slug",
      name: "slug",
      type: "slug",
      readOnly: true,
      options: {
        source: "title",
        slugify: (input: string) => input.toLowerCase().replace(/ /g, "-")
      }
    }
  ]
}
