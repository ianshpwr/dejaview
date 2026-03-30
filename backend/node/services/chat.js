import Groq from "groq-sdk";

const client = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

export async function askAI(journals, query, history, userName = 'friend') {
  
  const journalContext = journals?.length > 0
    ? journals.map((j, i) =>
        `[Journal ${i + 1}]\nTitle: ${j.title}\nDate: ${
          new Date(j.createdAt).toLocaleDateString()
        }\nContent: ${j.content}`
      ).join('\n\n---\n\n')
    : null

  const systemPrompt = `You are Dejaview, a personal journal 
companion for ${userName}. You have access to their private 
journal entries and full conversation history.

${journalContext
  ? `JOURNAL ENTRIES RELEVANT TO THIS QUESTION:
${journalContext}

These are ${userName}'s actual words from their journal.
Use this content directly when answering. If the answer 
is in the journals, state it confidently. Do not say 
"I don't see" or "I don't know" if the answer is above.`
  : `No journal entries matched this specific query.
Use the conversation history to stay in context.
If this is genuinely new information, engage with it 
and suggest they write about it.`
}

INSTRUCTIONS:
- Answer based on what is actually written in the journals above
- Reference specific details naturally like a friend who 
  remembers what ${userName} told them
- Use the full conversation history for continuity
- Be direct — if the journals say their name is X, say X
- Keep responses conversational, 2-4 sentences
- Ask one follow-up question at the end
- Match the user's energy and tone naturally`

  const groqMessages = [
    { role: 'system', content: systemPrompt },
    ...history.map(h => ({
      role: h.role === 'ai' || h.role === 'assistant' 
        ? 'assistant' 
        : 'user',
      content: h.content
    })),
    { role: 'user', content: query }
  ]

  const completion = await client.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: groqMessages,
    max_tokens: 400,
    temperature: 0.7
  })

  return completion.choices[0]?.message?.content?.trim() || ''
}
