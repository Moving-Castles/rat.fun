export default {
  title: "Stats",
  name: "statistics",
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
      title: "Rat total balance",
      name: "ratTotalBalance",
      type: "number",
      readOnly: true,
      validation: (Rule: any) => Rule.required()
    },
    {
      title: "Trip total balance",
      name: "tripTotalBalance",
      type: "number",
      readOnly: true,
      validation: (Rule: any) => Rule.required()
    }
    // {
    //   title: "Rat total spend",
    //   name: "ratTotalSpend",
    //   type: "number",
    //   description: "Total amount spent on rats",
    //   readOnly: true,
    //   validation: (Rule: any) => Rule.required()
    // },
    // {
    //   title: "Trip total spend",
    //   name: "tripTotalSpend",
    //   type: "number",
    //   description: "Total amount spent on rats",
    //   readOnly: true,
    //   validation: (Rule: any) => Rule.required()
    // }
  ]
}
