export default {
  title: "Rat images",
  name: "ratImages",
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
      title: "Rat images",
      name: "ratImages",
      type: "array",
      of: [{ type: "image" }],
      validation: (Rule: any) => Rule.required().min(1)
    }
  ]
}
