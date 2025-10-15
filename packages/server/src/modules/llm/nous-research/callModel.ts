import OpenAI from "openai"

export async function callModel(
  openai: OpenAI,
  messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
  system: string,
  model: string,
  temperature: number = 1
) {
  try {
    const msg = await openai.chat.completions.create({
      model,
      max_tokens: 1024,
      messages: [
        {
          role: "system",
          content: system
        },
        ...messages
      ],
      temperature
    })

    return parseReturnMessage(msg)
  } catch (error) {
    console.error("Error calling OpenAI API:", error)
    throw error
  }
}

function parseReturnMessage(msg: OpenAI.Chat.Completions.ChatCompletion) {
  try {
    // Get the content from the first choice
    const rawText = msg.choices[0]?.message?.content || ""

    // Remove Markdown-style code block indicators
    const cleanedText = rawText.replace(/^```json\s*/i, "").replace(/```$/, "")

    // Parse the text into a native object
    try {
      const returnValue = JSON.parse(cleanedText)
      return returnValue
    } catch (parseError) {
      console.error("Failed to parse LLM response as JSON:", parseError)
      console.error("Raw text:", rawText)
      throw parseError
    }
  } catch (error) {
    console.error("Error parsing LLM response:", error)
    throw error
  }
}
