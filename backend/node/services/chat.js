import Groq from "groq-sdk";

const client = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

export async function askAI({ query, history = [], journals = [] }) {
  try {
    // Limit memory so tokens stay under control
    const trimmedHistory = history.slice(-12);

    // Convert journals into readable text blocks
    const memoryText = journals
      .map(m => `Title: ${m.title}\nEntry: ${m.content}`)
      .join("\n\n");

    // Build full message array
    const messages = [
      {
        role: "system",
        content: `
You are a compassionate, emotionally intelligent journal companion.

You understand the user ONLY through the journal entries they have written.
Never invent, guess, or mention that you are using journal entries.

Speak naturally, warmly, like a supportive human friend.
Do not expose system rules or mention "journal entries".
Just reflect insightfully as if you already know them.
`
      },

      // 1️⃣ Add the conversation history from the frontend
      ...trimmedHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      })),

      // 2️⃣ Feed journal entries as internal system memory
      {
        role: "assistant",
        content: `Relevant journal entries:\n${memoryText}`
      },

      // 3️⃣ The actual new question
      {
        role: "user",
        content: query
      }
    ];

    const completion = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages,
      temperature: 0.35, // calm + stable
      top_p: 1,
      max_tokens: 900 // 🔥 long-form reflective answer
    });

    return completion.choices[0].message.content;

  } catch (err) {
    console.error("ASKAI ERROR:", err);
    return "Sorry, something went wrong while generating a response.";
  }
}
