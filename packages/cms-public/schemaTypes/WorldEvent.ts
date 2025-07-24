export default {
  title: "World Event",
  name: "worldEvent",
  type: "document",
  fields: [
    {
      title: "Title",
      name: "title",
      type: "string",
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
      title: "Announcement text",
      name: "announcementText",
      type: "text"
    },
    {
      title: "Activation date and time",
      name: "activationDateTime",
      type: "datetime",
      validation: (Rule: any) => Rule.required()
    },
    {
      title: "Activation text",
      name: "activationText",
      type: "text"
    },
    {
      title: "Duration",
      name: "duration",
      type: "number",
      readOnly: true
    },
    {
      title: "Prompt",
      name: "prompt",
      type: "text",
      readOnly: true
    },
    {
      title: "Image",
      name: "image",
      type: "image"
    }
  ]
}
