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
      title: "Daily Challenge Time (CET)",
      name: "dailyChallengeTime",
      type: "string",
      description:
        "Time when the daily challenge becomes available, in CET timezone (e.g. '14:00'). Leave empty to disable countdown.",
      validation: (Rule: any) =>
        Rule.regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).error("Must be in HH:MM format (e.g. 14:00)")
    },
    {
      title: "Next Challenge Day",
      name: "nextChallengeDay",
      type: "number",
      description:
        "Number of days from today when the next challenge occurs. 1 = tomorrow, 2 = day after tomorrow, etc. Leave empty or set to 0/1 for tomorrow.",
      validation: (Rule: any) => Rule.min(0).integer()
    },
    {
      title: "Challenge Title",
      name: "challengeTitle",
      type: "string",
      description: "Optional title for the current/upcoming challenge (shown on folder item)"
    }
  ]
}
