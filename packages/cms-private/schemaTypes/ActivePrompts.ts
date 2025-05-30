
export default {
    title: 'Active prompts',
    name: 'activePrompts',
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
            title: 'Event prompt',
            type: 'reference',
            name: 'activeEventPrompt',
            to: [{ type: 'prompt' }],
            validation: (Rule: any) => Rule.required()
        },
        {
            title: 'Correction prompt',
            type: 'reference',
            name: 'activeCorrectionPrompt',
            to: [{ type: 'prompt' }],
            validation: (Rule: any) => Rule.required()
        }
    ],
}
