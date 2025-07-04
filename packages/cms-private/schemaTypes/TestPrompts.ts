export default {
  title: "Test prompts",
  name: "testPrompts",
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
      title: "Test prompt A",
      type: "reference",
      name: "testPromptA",
      to: [{ type: "prompt" }],
      validation: (Rule: any) => Rule.required()
    },
    {
      title: "Test prompt B",
      type: "reference",
      name: "testPromptB",
      to: [{ type: "prompt" }],
      validation: (Rule: any) => Rule.required()
    }
  ]
}
