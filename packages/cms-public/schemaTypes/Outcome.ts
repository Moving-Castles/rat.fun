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
      title: "Trip ID",
      name: "tripId",
      type: "string",
      readOnly: true,
      validation: (Rule: any) => Rule.required()
    },
    {
      title: "Trip Index",
      name: "tripIndex",
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
      title: "Balance transfers",
      name: "balanceTransfers",
      type: "array",
      readOnly: true,
      of: [
        {
          type: "object",
          fields: [
            { type: "number", name: "logStep" },
            { type: "number", name: "amount" }
          ]
        }
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
      title: "Items lost on death",
      name: "itemsLostOnDeath",
      type: "array",
      readOnly: true,
      of: [
        {
          type: "object",
          fields: [
            { type: "string", name: "name" },
            { type: "number", name: "value" },
            { type: "string", name: "id" }
          ]
        }
      ]
    },
    {
      title: "Trip value (old)",
      description: "The value of the trip before the visit",
      name: "oldTripValue",
      type: "number",
      readOnly: true
    },
    {
      title: "Trip value change",
      name: "tripValueChange",
      type: "number",
      readOnly: true,
      validation: (Rule: any) => Rule.required()
    },
    {
      title: "Trip value (new)",
      description: "The value of the trip after the visit",
      name: "tripValue",
      type: "number",
      readOnly: true,
      validation: (Rule: any) => Rule.required()
    },
    {
      title: "Rat value (old)",
      description: "The value of the rat before the visit",
      name: "oldRatValue",
      type: "number",
      readOnly: true
    },
    {
      title: "Rat value change",
      name: "ratValueChange",
      type: "number",
      readOnly: true,
      validation: (Rule: any) => Rule.required()
    },
    {
      title: "Rat value (new)",
      description: "The value of the rat after the visit",
      name: "ratValue",
      type: "number",
      readOnly: true,
      validation: (Rule: any) => Rule.required()
    },
    {
      title: "Rat balance (old)",
      description: "The balance/health of the rat before the visit",
      name: "oldRatBalance",
      type: "number",
      readOnly: true
    },
    {
      title: "Rat balance (new)",
      description: "The balance/health of the rat after the visit",
      name: "newRatBalance",
      type: "number",
      readOnly: true
    },
    {
      title: "Main processing time",
      name: "mainProcessingTime",
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
