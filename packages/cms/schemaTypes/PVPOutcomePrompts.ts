
export default {
    title: 'PVP Outcome prompts',
    name: 'pvpOutcomePrompts',
    type: 'document',
    fields: [
        {
            title: 'Title',
            name: 'title',
            type: 'string',
            // readOnly: true,
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
