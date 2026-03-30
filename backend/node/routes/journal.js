import express from 'express';
import { PrismaClient } from '@prisma/client';
import Groq from 'groq-sdk';
import { askAI } from "../services/chat.js";
import { addVector, searchVector } from "../services/vectorize.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();
const prisma = new PrismaClient();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Columns confirmed to exist in the production DB.
// updatedAt does NOT exist — the migration never ran on the live DB.
const COLS = `id, title, content, mood, "createdAt", "userId"`;

// ── Health ─────────────────────────────────────────────────────────────────

router.get('/', (req, res) => {
  res.json({ status: 'Journal API is working' });
});

// ── GET /entries ────────────────────────────────────────────────────────────

router.get('/entries', authMiddleware, async (req, res) => {
  try {
    const entries = await prisma.$queryRawUnsafe(
      `SELECT ${COLS} FROM "Journal" WHERE "userId" = $1 ORDER BY "createdAt" DESC`,
      req.userId
    )
    res.json(entries)
  } catch (err) {
    console.error('[GET /entries]', err.message)
    res.status(500).json({ error: err.message })
  }
})

// ── GET /entries/summary (MUST be before /entries/:id) ─────────────────────

router.get('/entries/summary', authMiddleware, async (req, res) => {
  try {
    const entries = await prisma.$queryRawUnsafe(
      `SELECT id, title, content, mood, "createdAt"
       FROM "Journal"
       WHERE "userId" = $1
       ORDER BY "createdAt" DESC
       LIMIT 20`,
      req.userId
    )

    if (!entries || entries.length === 0) {
      return res.json({
        summary: "You haven't written any journal entries yet. Start writing to get your personal summary.",
        entryCount: 0
      })
    }

    const journalText = entries.map((e, i) =>
      `Entry ${i + 1} (${new Date(e.createdAt).toLocaleDateString()}) — ${e.title}:\n${e.content}`
    ).join('\n\n---\n\n')

    const prompt = `You are a compassionate journal companion. 
The user has written ${entries.length} journal entries. 
Based on ALL of these entries, provide a warm, personal, insightful summary covering:
1. Overall emotional journey and patterns
2. Key themes and topics they write about most
3. Their growth and changes over time
4. One encouraging observation about them as a person

Keep it personal, specific, and under 200 words.
Write directly to the user using "you" and "your".
Do not use bullet points — write in flowing paragraphs.

Here are their journal entries:
${journalText}`

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 500,
      temperature: 0.7
    })

    const summary = completion.choices[0]?.message?.content ||
      'Unable to generate summary at this time.'

    res.json({ summary, entryCount: entries.length })
  } catch (err) {
    console.error('[GET /entries/summary]', err.message)
    res.status(500).json({ error: err.message })
  }
})

// ── GET /entries/:id ───────────────────────────────────────────────────────

router.get('/entries/:id', authMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id)
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' })

    const rows = await prisma.$queryRawUnsafe(
      `SELECT ${COLS} FROM "Journal" WHERE id = $1 AND "userId" = $2 LIMIT 1`,
      id, req.userId
    )
    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: 'Entry not found' })
    }
    res.json(rows[0])
  } catch (err) {
    console.error('[GET /entries/:id]', err.message)
    res.status(500).json({ error: err.message })
  }
})

// ── POST /entries ───────────────────────────────────────────────────────────

router.post('/entries', authMiddleware, async (req, res) => {
  try {
    const { title, content, mood } = req.body

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Content is required' })
    }

    const rows = await prisma.$queryRawUnsafe(
      `INSERT INTO "Journal" (title, content, mood, "userId", "createdAt")
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING ${COLS}`,
      title || 'Untitled',
      content,
      mood || 'calm',
      req.userId
    )
    
    const entry = rows[0]
    
    try {
      // Add immediately to Vectorize using entry ID
      await addVector(process.env, content, {
        journalId: entry.id,
        userId: req.userId,
        title: entry.title,
        mood: entry.mood,
        createdAt: entry.createdAt,
        content: content.slice(0, 500)
      })
    } catch (vecErr) {
      console.log('Vectorize unavailable or missing bindings:', vecErr.message)
    }

    res.status(201).json(entry)
  } catch (err) {
    console.error('[POST /entries]', err.message)
    res.status(500).json({ error: err.message })
  }
})

// ── PATCH /entries/:id ──────────────────────────────────────────────────────

router.patch('/entries/:id', authMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id)
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' })

    const { title, content, mood } = req.body

    const check = await prisma.$queryRawUnsafe(
      `SELECT id FROM "Journal" WHERE id = $1 AND "userId" = $2 LIMIT 1`,
      id, req.userId
    )
    if (!check || check.length === 0) {
      return res.status(404).json({ error: 'Entry not found' })
    }

    const rows = await prisma.$queryRawUnsafe(
      `UPDATE "Journal"
       SET title = $1, content = $2, mood = $3
       WHERE id = $4 AND "userId" = $5
       RETURNING ${COLS}`,
      title, content, mood || 'calm', id, req.userId
    )

    res.json(rows[0])
  } catch (err) {
    console.error('[PATCH /entries/:id]', err.message)
    res.status(500).json({ error: err.message })
  }
})

// ── DELETE /entries/:id ─────────────────────────────────────────────────────

router.delete('/entries/:id', authMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id)
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid id' })
    }
    await prisma.$queryRawUnsafe(
      `DELETE FROM "Journal" WHERE id = $1 AND "userId" = $2`,
      id, req.userId
    )
    res.json({ success: true })
  } catch (err) {
    console.error('[DELETE /entries/:id]', err.message)
    res.status(500).json({ error: err.message })
  }
})

// ── POST /entries/chat ──────────────────────────────────────────────────────

router.post('/entries/chat', authMiddleware, async (req, res) => {
  try {
    const { message, history = [] } = req.body

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message is required' })
    }

    // Search Vectorize for relevant journal entries
    let matchedJournals = []
    try {
      const matches = await searchVector(process.env, message, 5)
      console.log(`[VECTOR SEARCH] Found ${matches?.length || 0} relative matches.`);
      
      if (matches && matches.length > 0) {
        console.log('[VECTOR METADATA]', matches.map(m => m.metadata?.title || 'Untitled'));
        // Filter out matches not belonging to user if using a shared index
        // Or directly construct journals from metadata without DB trip
        matchedJournals = matches
          .filter(m => m.metadata?.userId === req.userId)
          .map(m => ({
            id: m.metadata.journalId,
            title: m.metadata.title || 'Journal Entry',
            content: m.metadata.content,
            mood: m.metadata.mood || 'calm',
            createdAt: m.metadata.createdAt || new Date()
          }))
      }
    } catch (vecErr) {
      console.log('Vectorize search failed:', vecErr.message)
    }

    if (!matchedJournals || matchedJournals.length === 0) {
      const words = message
        .toLowerCase()
        .replace(/[^a-z0-9 ]/g, '')
        .split(' ')
        .filter(w => w.length > 3)
        .slice(0, 4)
      
      if (words.length > 0) {
        const conditions = words
          .map((_, i) => `LOWER(content) LIKE $${i + 2}`)
          .join(' OR ')
        
        matchedJournals = await prisma.$queryRawUnsafe(`
          SELECT id, title, content, mood, "createdAt"
          FROM "Journal"
          WHERE "userId" = $1 AND (${conditions})
          ORDER BY "createdAt" DESC
          LIMIT 5
        `, req.userId, ...words.map(w => `%${w}%`))
      }
    }

    if (!matchedJournals || matchedJournals.length === 0) {
      matchedJournals = await prisma.$queryRawUnsafe(`
        SELECT id, title, content, mood, "createdAt"
        FROM "Journal"
        WHERE "userId" = $1
        ORDER BY "createdAt" DESC
        LIMIT 5
      `, req.userId)
    }

    const userResult = await prisma.$queryRawUnsafe(`
      SELECT name FROM "User" WHERE id = $1
    `, req.userId)
    const userName = userResult?.[0]?.name || 'friend'

    // Pass full history (last 12 messages) to AI
    const recentHistory = history.slice(-12)
    
    const reply = await askAI(
      matchedJournals, 
      message, 
      recentHistory,
      userName
    )

    console.log('[SENDING TO FRONTEND]', {
      replyLength: reply?.length,
      entriesCount: matchedJournals?.length
    })

    res.json({ 
      reply,
      referencedEntries: matchedJournals.map(j => ({
        id: j.id,
        title: j.title,
        mood: j.mood,
        createdAt: j.createdAt,
        excerpt: j.content.slice(0, 100)
      }))
    })
  } catch (err) {
    console.error('[POST /entries/chat]', err.message)
    res.status(500).json({ error: err.message })
  }
})

export default router;