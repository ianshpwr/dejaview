import express from 'express';
import { PrismaClient } from '@prisma/client';
import { searchFaiss } from "../services/faiss.js";
import { askAI } from "../services/chat.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();
const prisma = new PrismaClient();

// Columns confirmed to exist in the production DB.
// updatedAt does NOT exist — the migration never ran on the live DB.
const COLS = `id, title, content, mood, "faissId", "createdAt", "userId"`;

// ── Health ─────────────────────────────────────────────────────────────────

router.get('/', (req, res) => {
  res.json({ status: 'Journal API is working' });
});

router.get("/debug-faiss", (req, res) => {
  res.json({ FAISS_URL: process.env.FAISS_URL });
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

    let faissId = null
    try {
      const faissRes = await fetch(process.env.FAISS_URL + '/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: content })
      })
      if (faissRes.ok) {
        const faissData = await faissRes.json()
        faissId = faissData.faissId ?? faissData.id ?? null
      }
    } catch (faissErr) {
      console.error('FAISS unavailable:', faissErr.message)
    }

    const rows = await prisma.$queryRawUnsafe(
      `INSERT INTO "Journal" (title, content, mood, "faissId", "userId", "createdAt")
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING ${COLS}`,
      title || 'Untitled',
      content,
      mood || 'calm',
      faissId,
      req.userId
    )

    res.status(201).json(rows[0])
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
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' })

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

router.post("/entries/chat", authMiddleware, async (req, res) => {
  const { query, history = [] } = req.body;
  try {
    let journals = [];
    try {
      const raw = await searchFaiss(query, 5);
      const ids = raw.map(r => r.id);
      if (ids.length > 0) {
        journals = await prisma.$queryRawUnsafe(
          `SELECT ${COLS} FROM "Journal"
           WHERE "userId" = $1 AND "faissId" = ANY($2::int[])`,
          req.userId, ids
        )
      }
    } catch (faissErr) {
      console.error('FAISS search failed, using fallback:', faissErr.message);
      journals = await prisma.$queryRawUnsafe(
        `SELECT ${COLS} FROM "Journal"
         WHERE "userId" = $1 ORDER BY "createdAt" DESC LIMIT 5`,
        req.userId
      )
    }

    const answer = await askAI({ query, history, journals });
    res.json({ answer, memories: journals });
  } catch (err) {
    console.error('[POST /entries/chat]', err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;