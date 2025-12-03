import Groq from "groq-sdk";

const client = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

export async function askAI(question, memories) {
  const memoryText = memories
    .map(m => `Title: ${m.title}\nEntry: ${m.content}`)
    .join("\n\n");

  const completion = await client.chat.completions.create({
    model: "llama-3.3-70b-versatile",  // correct model ID
    messages: [
      {
        role: "system",
        content:
          `You are a compassionate, emotionally intelligent journal companion.
You understand the user only through the journal entries they have written. 
You never assume, guess, or invent details that are not present in their entries.

When the user asks something, respond as a real human would in a natural, warm, conversational tone.
Use the information from their past entries to answer directly, without referencing the journal or how you know it.
Do not say things like “you wrote…” or “according to your entry…” or anything that exposes the system.
Simply answer naturally as if you already know them, but only based on what they have shared before.

Your role is to reflect their inner world with empathy, emotional clarity, and gentle guidance.
Be warm, honest, and supportive, helping them understand themselves while staying grounded only in the information they have provided.
`
      },
      {
        role: "user",
        content: `
User question: ${question}

Relevant Journal Entries:
${memoryText}

Now answer based only on these entries.
`
      }
    ],
    temperature: 0.81,
    max_tokens: 80,
    top_p: 1
  });

  return completion.choices[0].message.content;
}
