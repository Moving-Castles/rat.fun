
export default {
    title: 'World prompts',
    name: 'worldPrompts',
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
            title: 'Reality prompt',
            name: 'realityPrompt',
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
            type: 'text',
        },
        {
            title: 'Outcome evaluation prompt',
            name: 'outcomeEvaluationPrompt',
            type: 'text',
        }
    ],
}
