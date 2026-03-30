import express from 'express';
import { PrismaClient } from '@prisma/client';
import { addToFaiss } from "../services/faiss.js";
import { searchFaiss } from "../services/faiss.js";

const router = express.Router();
const prisma = new PrismaClient();
import { askAI } from "../services/chat.js";

// Example route to get all journal entries
router.get('/', (req, res) => {
    res.send('Journal API is working');
});

router.get("/debug-faiss", (req, res) => {
  res.json({
    FAISS_URL: process.env.FAISS_URL,
  });
});

router.get('/entries/:userId', async (req, res) => {
    try {
        const entries = await prisma.journal.findMany({
            where: { userId: Number(req.params.userId) },
            orderBy: { createdAt: 'desc' },
        });
        res.status(200).json(entries);
    } catch (err) {
        console.error('GET /entries error:', err);
        res.status(500).json({ error: 'Failed to fetch entries' });
    }
});

router.post('/entries', async (req, res) => {
    const { title, content, userId, mood } = req.body;

    try {
        const faissId = await addToFaiss(content);
        const newEntry = await prisma.journal.create({
            data: {
                title: title || '',
                content: content,
                userId: Number(userId),
                faissId: faissId,
                mood: mood || 'calm',
            },
        });
        res.status(201).json(newEntry);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error creating journal entry' });
    }
});

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
        res.status(500).json({ message: 'Error updating journal entry' });
    }
});


router.delete('/entries/:id', async (req,res)=>{
    const entryId = req.params.id;
    try{
        await prisma.journal.delete({
            where : {id : Number(entryId)}
        });
        res.status(200).json({message : "Entry deleted successfully"});
    } catch (err) {
        res.status(500).json({ message: 'Error deleting journal entry' });
    }
})


router.post("/entries/chat", async (req, res) => {
    const { query, userId, history = [] } = req.body;

    try {
        // 1️⃣ Get FAISS search results
        const raw = await searchFaiss(query, 5);
        const ids = raw.map(r => r.id);

        // 2️⃣ Fetch matching journal entries
        const journals = await prisma.journal.findMany({
            where: {
                userId: Number(userId),
                faissId: { in: ids }
            }
        });

        // 3️⃣ Build dynamic prompt using history + journals
        const answer = await askAI({
            query,
            history,
            journals
        });

        res.json({
            answer,
            memories: journals
        });

    } catch (err) {
        console.error("CHAT ERROR:", err);
        res.status(500).json({
            error: "Chat failed",
            details: err.message
        });
    }
});

export default router;