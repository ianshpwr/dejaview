import Groq from "groq-sdk";

const client = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

export async function askAI({ query, history = [], journals = [] }) {
  try {
    // Limit memory so tokens stay under control
    const trimmedHistory = history.slice(-12);

    // Build strict system prompt grounded in actual journal entries
    const memoryContext = journals.length > 0
      ? journals.map((j, i) =>
          `[Memory ${i + 1}] "${j.title}" — ${j.content.slice(0, 300)}...`
        ).join('\n\n')
      : 'No relevant journal entries were found for this question.';

    const systemPrompt = `You are Dejaview, a personal journal companion AI. You have been given excerpts from the user's own journal entries as context.

STRICT RULES you must follow:
1. ONLY discuss what is in the provided journal entries. Do not bring up topics, advice, or information that is not grounded in what the user has actually written.
2. If the user asks something not covered by their journals, say: "I don't see anything about that in your journals yet. Would you like to write about it?"
3. Never pretend to know things about the user that are not in the journal entries provided.
4. Never give generic life advice — only reflect back what the user has written, with empathy and insight.
5. Speak warmly and personally, like a trusted friend who has read their diary.
6. Keep responses concise — 2 to 4 sentences maximum unless the user asks for more detail.
7. Never say "Based on your journals" or "I can see in your entries" — just speak naturally as if you remember their thoughts.

The following are excerpts from this user's actual journal entries that are relevant to their question:

${memoryContext}`;

    // Build messages — sanitize history roles: 'ai' → 'assistant'
    const messages = [
      { role: 'system', content: systemPrompt },
      ...trimmedHistory.map(h => ({
        role: (h.role === 'ai' ? 'assistant' : h.role === 'user' ? 'user' : 'assistant'),
        content: h.content
      })),
      { role: 'user', content: query }
    ];

    const completion = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages,
      temperature: 0.4,
      top_p: 1,
      max_tokens: 400
    });

    return completion.choices[0].message.content;

  } catch (err) {
    console.error("ASKAI ERROR:", err);
    return "Sorry, something went wrong while generating a response.";
  }
}
