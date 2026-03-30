import Groq from "groq-sdk";

const client = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

export async function askAI(journals, query, history) {
  
  const journalContext = journals && journals.length > 0
    ? journals.map((j, i) => 
        `[Journal ${i + 1}] Title: "${j.title}"
Content: ${j.content.slice(0, 500)}`
      ).join('\n\n')
    : null

  const systemPrompt = `You are Dejaview, a warm and 
empathetic personal journal companion. You help users 
reflect on their thoughts, feelings, and experiences 
based on what they have written in their journal.

YOUR PERSONALITY:
- Warm, caring, and genuinely curious about the user
- You remember everything they have shared with you
- You make connections between different things they 
  have written or said in this conversation
- You ask thoughtful follow-up questions
- You validate feelings without being preachy

HOW TO RESPOND:
- Always reference the conversation history when relevant
  If the user said something earlier in this chat, 
  acknowledge it and connect it to what they are saying now
- If relevant journal entries are provided, weave them 
  naturally into your response without saying 
  "I can see in your journals"
- If no journal entries match but the user shared 
  something in the conversation itself, use THAT as context
- Keep responses 2-5 sentences — warm and focused
- End with a gentle question to keep the conversation going
- Never give generic advice — always be specific to 
  what THIS user has shared

${journalContext 
  ? `RELEVANT JOURNAL ENTRIES FROM THIS USER:\n${journalContext}`
  : `No matching journal entries found for this specific query,
but use the conversation history below to stay in context.
If the user is sharing something new, engage with it warmly
and encourage them to journal about it.`
}`

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
    temperature: 0.6
  })

  return completion.choices[0]?.message?.content || 
    'I had trouble responding. Please try again.'
}
