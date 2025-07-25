export default {
  title: "World Event",
  name: "worldEvent",
  type: "document",
  fields: [
    {
      title: "Title",
      description:
        "Generic title before activation. Then value is set on chain and this field is updated.",
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
      title: "Publication text",
      description: "If set, used in UI before activation",
      name: "publicationText",
      type: "text"
    },
    {
      title: "Activation date and time",
      description: "Target for countdown",
      name: "activationDateTime",
      type: "datetime",
      validation: (Rule: any) => Rule.required()
    },
    {
      title: "Activation text",
      description: "Used in UI after activation. Complement to the prompt.",
      name: "activationText",
      type: "text"
    },
    {
      title: "Duration",
      description: "Duration of the event in blocks. Readonly. Set on chain.",
      name: "duration",
      type: "number",
      readOnly: true
    },
    {
      title: "Prompt",
      description: "Readonly. Set on chain.",
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
