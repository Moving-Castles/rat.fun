export default {
  title: "Template images",
  name: "templateImages",
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
      title: "Room images",
      name: "roomImages",
      type: "array",
      of: [{ type: "image" }],
      validation: (Rule: any) => Rule.required().min(1)
    }
  ]
}
