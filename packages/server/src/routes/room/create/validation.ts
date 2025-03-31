export function validateInputData(roomName: string, roomPrompt: string) {
    if (roomName.length < 10 || roomName.length > 50) {
        throw new Error('Room name must be between 10 and 50 characters.');
    } 

    // Check that the prompt is less than 1000 characters
    if (roomPrompt.length < 10 || roomPrompt.length > 500) {
        throw new Error('Room prompt must be between 10 and 500 characters.');
    }
}