export default {
  title: "Rat images",
  name: "ratImages",
  type: "document",
  fields: [
    {
      title: "Title",
      name: "title",
      type: "string",
      validation: (Rule: any) => Rule.required()
    },
    {
      title: "Rat images",
      name: "ratImages",
      type: "array",
      of: [{ type: "image" }],
      validation: (Rule: any) => Rule.required().min(1)
    },
    {
      title: "Rat bodies",
      name: "ratBodies",
      type: "array",
      of: [{ type: "image" }],
      validation: (Rule: any) => Rule.required().min(1)
    },
    {
      title: "Rat arms",
      name: "ratArms",
      type: "array",
      of: [{ type: "image" }],
      validation: (Rule: any) => Rule.required().min(1)
    },
    {
      title: "Rat heads",
      name: "ratHeads",
      type: "array",
      of: [{ type: "image" }],
      validation: (Rule: any) => Rule.required().min(1)
    },
    {
      title: "Rat ears",
      name: "ratEars",
      type: "array",
      of: [{ type: "image" }],
      validation: (Rule: any) => Rule.required().min(1)
    }
  ]
}
