
export default {
    title: 'Prompt',
    name: 'prompt',
    type: 'document',
    fields: [
        {
            title: 'Title',
            name: 'title',
            type: 'string',
            validation: (Rule: any) => Rule.required()
        },
        {
            title: 'Prompt',
            name: 'prompt',
            type: 'markdown',
        },
        {
            title: 'Return format',
            description: "Do not edit.",
            name: 'returnFormat',
            type: 'code'
        }
    ],
}
