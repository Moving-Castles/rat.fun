export default {
  title: "Trip Folder List",
  name: "tripFolderList",
  type: "document",
  fields: [
    {
      title: "Title",
      name: "title",
      type: "string",
      validation: (Rule: any) => Rule.required()
    },
    {
      title: "Folders",
      name: "folders",
      type: "array",
      of: [
        {
          type: "reference",
          to: [{ type: "tripFolder" }]
        }
      ],
      validation: (Rule: any) => Rule.required().min(1)
    }
  ]
}
