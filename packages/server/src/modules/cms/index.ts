import { loadData } from "@modules/cms/sanity";
import { queries } from "@modules/cms/groq";
import type { ActivePrompts, Prompt } from "@sanity-types";
import { client } from "./sanity";
// import { createReadStream } from 'fs';

// - - - - - - 
// READ
// - - - - - - 

type ExpandedActivePrompts = ActivePrompts & {
    activeEventPrompt: Prompt;
    activeCorrectionPrompt: Prompt;
}

export const getSystemPrompts = async () => {
    const activePrompts = await loadData(queries.activePrompts, {}) as ExpandedActivePrompts;
    return {
        combinedSystemPrompt: combineSystemPrompts(activePrompts.activeEventPrompt),
        correctionSystemPrompt: combineSystemPrompts(activePrompts.activeCorrectionPrompt)
    };
}

function combineSystemPrompts(doc: Prompt) {
    return `Return format: ${doc.returnFormat?.code ?? ""} // ${doc.prompt ?? ""}`; 
}

// - - - - - - 
// WRITE
// - - - - - - 

export async function writeRoomToCMS(worldAddress: string, roomID: string, prompt: string, imagePath: string) {
    // Create a read stream from the image file
    // const imageStream = createReadStream(imagePath);
    
    // Upload the image to Sanity using the file stream
    // const imageAsset = await client.assets.upload('image', imageStream, {
    //     filename: `room-${roomID}${imagePath.substring(imagePath.lastIndexOf('.'))}`,
    //     contentType: 'image/png' // You might want to determine this based on the file extension
    // });

    // Create the room document with the uploaded image reference
    const newRoomDoc = {
        _type: "room",
        title: roomID,
        _id: roomID,
        worldAddress: worldAddress,
        prompt,
        // image: {
        //     _type: "image",
        //     asset: {
        //         _type: "reference",
        //         _ref: imageAsset._id
        //     }
        // },
        slug: {
            _type: "slug",
            current: roomID
        }
    };

    // Create the room document in Sanity
    const room = await client.create(newRoomDoc);
    
    return room;
}