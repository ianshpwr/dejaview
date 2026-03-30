import express from 'express';
import { PrismaClient } from '@prisma/client';
import { searchFaiss } from "../services/faiss.js";
import { askAI } from "../services/chat.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();
const prisma = new PrismaClient();

// ── Health / debug ─────────────────────────────────────────────────────────

router.get('/', (req, res) => {
    try {
        res.json({ status: 'Journal API is working' });
    } catch (err) {
        console.error('[ERROR]', err);
        res.status(500).json({ error: err.message });
    }
});

router.get("/debug-faiss", (req, res) => {
    try {
        res.json({ FAISS_URL: process.env.FAISS_URL });
    } catch (err) {
        console.error('[ERROR]', err);
        res.status(500).json({ error: err.message });
    }
});

// ── GET /entries ────────────────────────────────────────────────────────────

router.get('/entries', authMiddleware, async (req, res) => {
  try {
    const entries = await prisma.$queryRaw`
      SELECT id, title, content, mood, "faissId",
             "createdAt", "updatedAt", "userId"
      FROM "Journal"
      WHERE "userId" = ${req.userId}
      ORDER BY "createdAt" DESC
    `
    res.json(entries)
  } catch (err) {
    console.error('[GET /entries]', err)
    res.status(500).json({ error: err.message })
  }
})

// ── GET /entries/:id ───────────────────────────────────────────────────────

router.get('/entries/:id', authMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id)
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid id' })
    }
    const entries = await prisma.$queryRaw`
      SELECT id, title, content, mood, "faissId",
             "createdAt", "updatedAt", "userId"
      FROM "Journal"
      WHERE id = ${id} AND "userId" = ${req.userId}
      LIMIT 1
    `
    if (!entries || entries.length === 0) {
      return res.status(404).json({ error: 'Entry not found' })
    }
    res.json(entries[0])
  } catch (err) {
    console.error('[GET /entries/:id]', err)
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
      const faissRes = await fetch(
        process.env.FAISS_URL + '/add',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: content })
        }
      )
      if (faissRes.ok) {
        const faissData = await faissRes.json()
        faissId = faissData.faissId ?? faissData.id ?? null
      }
    } catch (faissErr) {
      console.error('FAISS unavailable:', faissErr.message)
    }

    // Step 1 — Create entry without mood (avoids stale Prisma client issue)
    const entry = await prisma.journal.create({
      data: {
        title: title || 'Untitled',
        content: content || '',
        faissId: faissId ?? null,
        userId: req.userId
      }
    })

    // Step 2 — Set mood via raw SQL, bypassing Prisma client validation
    const finalMood = mood || 'calm'
    if (entry.id) {
      await prisma.$executeRaw`
        UPDATE "Journal"
        SET mood = ${finalMood}
        WHERE id = ${entry.id}
      `
    }

    res.status(201).json({ ...entry, mood: finalMood })
  } catch (err) {
    console.error('[POST /entries]', err)
    res.status(500).json({ error: err.message })
  }
})

// ── PATCH /entries/:id ──────────────────────────────────────────────────────

router.patch('/entries/:id', authMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id)
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid id' })
    }

    const { title, content, mood } = req.body

    // Verify ownership first
    const rows = await prisma.$queryRaw`
      SELECT id, mood FROM "Journal"
      WHERE id = ${id} AND "userId" = ${req.userId}
      LIMIT 1
    `
    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: 'Entry not found' })
    }
    const existing = rows[0]

    // Update core fields via Prisma ORM
    const updated = await prisma.journal.update({
      where: { id },
      data: {
        ...(title !== undefined ? { title } : {}),
        ...(content !== undefined ? { content } : {})
      }
    })

    // Update mood via raw SQL
    if (mood !== undefined) {
      await prisma.$executeRaw`
        UPDATE "Journal"
        SET mood = ${mood}
        WHERE id = ${id} AND "userId" = ${req.userId}
      `
    }

    res.json({ ...updated, mood: mood || existing.mood || 'calm' })
  } catch (err) {
    console.error('[PATCH /entries/:id]', err)
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

    const rows = await prisma.$queryRaw`
      SELECT id FROM "Journal"
      WHERE id = ${id} AND "userId" = ${req.userId}
      LIMIT 1
    `
    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: 'Entry not found' })
    }

    await prisma.journal.delete({ where: { id } })
    res.status(200).json({ message: "Entry deleted successfully" })
  } catch (err) {
    console.error('[DELETE /entries/:id]', err)
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
            journals = await prisma.$queryRaw`
              SELECT id, title, content, mood, "faissId", "createdAt", "userId"
              FROM "Journal"
              WHERE "userId" = ${req.userId} AND "faissId" = ANY(${ids}::int[])
            `
        } catch (faissErr) {
            console.error('FAISS search failed, using empty context:', faissErr.message);
            journals = await prisma.$queryRaw`
              SELECT id, title, content, mood, "faissId", "createdAt", "userId"
              FROM "Journal"
              WHERE "userId" = ${req.userId}
              ORDER BY "createdAt" DESC
              LIMIT 5
            `
        }

        const answer = await askAI({ query, history, journals });
        res.json({ answer, memories: journals });

    } catch (err) {
        console.error('[ERROR]', err);
        res.status(500).json({ error: err.message });
    }
});

export default router;