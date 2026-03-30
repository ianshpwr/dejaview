import express from 'express';
import { PrismaClient } from '@prisma/client';
import { searchFaiss } from "../services/faiss.js";
import { askAI } from "../services/chat.js";

const router = express.Router();
const prisma = new PrismaClient();

// ── Health / debug ─────────────────────────────────────────────────────────

router.get('/', (req, res) => {
    res.json({ status: 'Journal API is working' });
});

router.get("/debug-faiss", (req, res) => {
    res.json({ FAISS_URL: process.env.FAISS_URL });
});

// ── GET /entries/:userId (All entries for a user) ────────

router.get('/entries/:userId', async (req, res) => {
    try {
        const entries = await prisma.journal.findMany({
            where: { userId: Number(req.params.userId) },
            orderBy: { createdAt: 'desc' },
        });
        res.status(200).json(entries);
    } catch (err) {
        console.error('[ROUTE ERROR]', req.method, req.path, err);
        res.status(500).json({ error: err.message || 'Failed to fetch entries' });
    }
});

// ── GET /entries/single/:id (Get one entry) ───────────────

router.get('/entries/single/:id', async (req, res) => {
    try {
        const entryId = Number(req.params.id);
        if (isNaN(entryId)) {
            return res.status(400).json({ error: 'Invalid entry ID' });
        }
        const entry = await prisma.journal.findFirst({
            where: { id: entryId }
        });
        
        if (!entry) {
            return res.status(404).json({ error: 'Entry not found' });
        }
        res.json(entry);
    } catch (err) {
        console.error('[ROUTE ERROR]', req.method, req.path, err);
        res.status(500).json({ error: err.message || 'Failed to fetch entry' });
    }
});

// ── POST /entries ───────────────────────────────────────────────────────────

router.post('/entries', async (req, res) => {
    const { title, content, userId, mood } = req.body;

    // Fault-tolerant FAISS — a FAISS failure must never prevent saving
    let faissId = null;
    try {
        const { addToFaiss } = await import("../services/faiss.js");
        faissId = await addToFaiss(content);
    } catch (faissErr) {
        console.error('FAISS unavailable, saving without embedding:', faissErr.message);
    }

    try {
        const newEntry = await prisma.journal.create({
            data: {
                title: title || '',
                content: content,
                userId: Number(userId),
                faissId: faissId ?? null,
                mood: mood || 'calm',
            },
        });
        res.status(201).json(newEntry);
    } catch (err) {
        console.error('[ROUTE ERROR]', req.method, req.path, err);
        res.status(500).json({ error: err.message || 'Error creating journal entry' });
    }
});

// ── PATCH /entries/:id ──────────────────────────────────────────────────────

router.patch('/entries/:id', async (req, res) => {
    const { title, content, mood } = req.body;
    const entryId = req.params.id;
    try {
        const updatedEntry = await prisma.journal.update({
            where: { id: Number(entryId) },
            data: {
                title: title,
                content: content,
                ...(mood ? { mood } : {}),
            },
        });
        res.status(200).json(updatedEntry);
    } catch (err) {
        console.error('[ROUTE ERROR]', req.method, req.path, err);
        res.status(500).json({ error: err.message || 'Error updating journal entry' });
    }
});

// ── DELETE /entries/:id ─────────────────────────────────────────────────────

router.delete('/entries/:id', async (req, res) => {
    const entryId = req.params.id;
    try {
        await prisma.journal.delete({
            where: { id: Number(entryId) }
        });
        res.status(200).json({ message: "Entry deleted successfully" });
    } catch (err) {
        console.error('[ROUTE ERROR]', req.method, req.path, err);
        res.status(500).json({ error: err.message || 'Error deleting journal entry' });
    }
});

// ── POST /entries/chat ──────────────────────────────────────────────────────

router.post("/entries/chat", async (req, res) => {
    const { query, userId, history = [] } = req.body;

    try {
        // Fault-tolerant FAISS search — fall back to empty if FAISS is down
        let journals = [];
        try {
            const raw = await searchFaiss(query, 5);
            const ids = raw.map(r => r.id);
            journals = await prisma.journal.findMany({
                where: { userId: Number(userId), faissId: { in: ids } }
            });
        } catch (faissErr) {
            console.error('FAISS search failed, using empty context:', faissErr.message);
            // Fall back: fetch the 5 most recent entries as context
            journals = await prisma.journal.findMany({
                where: { userId: Number(userId) },
                orderBy: { createdAt: 'desc' },
                take: 5,
            });
        }

        const answer = await askAI({ query, history, journals });
        res.json({ answer, memories: journals });

    } catch (err) {
        console.error('[ROUTE ERROR]', req.method, req.path, err);
        res.status(500).json({ error: err.message || 'Chat failed' });
    }
});

export default router;