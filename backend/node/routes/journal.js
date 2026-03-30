import express from 'express';
import { PrismaClient } from '@prisma/client';
import { searchFaiss } from "../services/faiss.js";
import { askAI } from "../services/chat.js";

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

// ── GET /entries/:userId (All entries for a user) ────────

router.get('/entries/:userId', async (req, res) => {
    try {
        const entries = await prisma.journal.findMany({
            where: { userId: Number(req.params.userId) },
            orderBy: { createdAt: 'desc' },
        });
        res.status(200).json(entries);
    } catch (err) {
        console.error('[ERROR]', err);
        res.status(500).json({ error: err.message });
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
        console.error('[ERROR]', err);
        res.status(500).json({ error: err.message });
    }
});

// ── POST /entries ───────────────────────────────────────────────────────────

router.post('/entries', async (req, res) => {
    const { title, content, userId, mood } = req.body;

    let faissId = null;
    try {
        const faissRes = await fetch(process.env.FAISS_URL + '/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: content })
        });
        const faissData = await faissRes.json();
        faissId = faissData.faissId ?? faissData.id ?? null;
    } catch (e) {
        console.error('FAISS failed, continuing without embedding:', e.message);
    }

    try {
        const newEntry = await prisma.journal.create({
            data: {
                title: title || '',
                content: content,
                userId: req.userId || Number(userId),
                faissId: faissId,
                mood: mood || 'calm',
            },
        });
        res.status(201).json(newEntry);
    } catch (err) {
        console.error('[ERROR]', err);
        res.status(500).json({ error: err.message });
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
        console.error('[ERROR]', err);
        res.status(500).json({ error: err.message });
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
        console.error('[ERROR]', err);
        res.status(500).json({ error: err.message });
    }
});

// ── POST /entries/chat ──────────────────────────────────────────────────────

router.post("/entries/chat", async (req, res) => {
    const { query, userId, history = [] } = req.body;

    try {
        let journals = [];
        try {
            const raw = await searchFaiss(query, 5);
            const ids = raw.map(r => r.id);
            journals = await prisma.journal.findMany({
                where: { userId: Number(userId), faissId: { in: ids } }
            });
        } catch (faissErr) {
            console.error('FAISS search failed, using empty context:', faissErr.message);
            journals = await prisma.journal.findMany({
                where: { userId: Number(userId) },
                orderBy: { createdAt: 'desc' },
                take: 5,
            });
        }

        const answer = await askAI({ query, history, journals });
        res.json({ answer, memories: journals });

    } catch (err) {
        console.error('[ERROR]', err);
        res.status(500).json({ error: err.message });
    }
});

export default router;