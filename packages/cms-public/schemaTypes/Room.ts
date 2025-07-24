export default {
  title: "Room",
  name: "room",
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
      title: "Owner",
      name: "owner",
      type: "string",
      readOnly: true,
      validation: (Rule: any) => Rule.required()
    },
    {
      title: "Owner name",
      name: "ownerName",
      type: "string",
      readOnly: true,
      validation: (Rule: any) => Rule.required()
    },
    {
      title: "Prompt",
      name: "prompt",
      type: "text",
      readOnly: true,
      validation: (Rule: any) => Rule.required()
    },
    {
      title: "Image",
      name: "image",
      type: "image",
      readOnly: true,
      validation: (Rule: any) => Rule.required()
    },
    {
      title: "Slug",
      name: "slug",
      type: "slug",
      options: {
        source: "title",
        slugify: (input: string) => input.toLowerCase().replace(/ /g, "-")
      }
    }
  ]
}
