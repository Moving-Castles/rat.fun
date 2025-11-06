export default {
  title: "Trip",
  name: "trip",
  type: "document",
  groups: ["statistics"],
  fields: [
    {
      title: "Title",
      name: "title",
      type: "string",
      readOnly: true,
      validation: (Rule: any) => Rule.required()
    },
    {
      title: "Index",
      name: "index",
      type: "number",
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
      title: "Archetype | Gives Items",
      name: "archetypeItemAdd",
      type: "number",
      validation: (Rule: any) => Rule.required()
    },
    {
      title: "Archetype | Takes Items",
      name: "archetypeItemRemove",
      type: "number",
      validation: (Rule: any) => Rule.required()
    },
    {
      title: "Archetype | Gives Health",
      name: "archetypeBalanceAdd",
      type: "number",
      validation: (Rule: any) => Rule.required()
    },
    {
      title: "Archetype | Takes Health",
      name: "archetypeBalanceRemove",
      type: "number",
      validation: (Rule: any) => Rule.required()
    },
    {
      title: "Kills",
      name: "kills",
      type: "number",
      validation: (Rule: any) => Rule.required()
    },
    {
      title: "Visits",
      name: "visits",
      type: "number",
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
    },
    {
      title: "Folder",
      name: "folder",
      type: "reference",
      to: [{ type: "tripFolder" }],
      readOnly: true
    }
  ]
}
