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
          "You are an empathetic, intelligent personal journal assistant. Use ONLY the user’s journal entries; do NOT hallucinate. Give helpful, emotional, and reflective insights."
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
    temperature: 0.7,
    max_tokens: 500,
    top_p: 1
  });

  return completion.choices[0].message.content;
}
