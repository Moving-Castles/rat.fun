Script to create a world event.

Happens in two steps:

1. Announcement

- New world event document is created on the public sanity cms
- Including activation date and time (required)
- Announcement text (optional)

2. Activation

- Send transaction to create the world event onchain (args are: title, prompt, duration in blocks and id of the world event document)
- Updates the world event document with the title, prompt, activationText, and duration
