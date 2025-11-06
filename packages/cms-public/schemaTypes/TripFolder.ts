export default {
  title: "Trip Folder",
  name: "tripFolder",
  type: "document",
  fields: [
    {
      title: "Title",
      name: "title",
      type: "string",
      validation: (Rule: any) => Rule.required()
    },
    {
      title: "Restricted",
      name: "restricted",
      type: "boolean",
      initialValue: false,
      validation: (Rule: any) => Rule.required()
    },
    {
      title: "Description",
      name: "description",
      type: "text"
      // validation: (Rule: any) => Rule.required()
    },
    {
      title: "Image",
      name: "image",
      type: "image"
      // validation: (Rule: any) => Rule.required()
    }
  ]
}
