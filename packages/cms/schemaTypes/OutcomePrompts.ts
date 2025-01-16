
export default {
    title: 'Outcome prompts',
    name: 'outcomePrompts',
    type: 'document',
    fields: [
        {
            title: 'Title',
            name: 'title',
            type: 'string',
            readOnly: true,
            validation: (Rule: any) => Rule.required()
        },
        {
            title: 'Main prompt',
            name: 'mainPrompt',
            type: 'text',
        },
        {
            title: 'Style prompt',
            name: 'stylePrompt',
            type: 'text',
        },
        {
            title: 'Format prompt',
            description: "Be careful editing this as it will effect the return format.",
            name: 'formatPrompt',
            type: 'code'        
        }
    ],
}
