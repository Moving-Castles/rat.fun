export default {
  title: "Challenge",
  name: "challenge",
  type: "document",
  fields: [
    {
      title: "Title",
      name: "title",
      type: "string",
      validation: (Rule: any) => Rule.required()
    },
    {
      title: "Whitelist",
      name: "whitelist",
      type: "array",
      of: [{ type: "string" }],
      description: "Ethereum addresses allowed to create challenge trips"
    },
    {
      title: "Next Challenge",
      name: "nextChallenge",
      type: "datetime",
      description: "Date and time of the next challenge trip"
    }
  ]
}
