import express from 'express';
import { PrismaClient } from '@prisma/client';
import { addToFaiss } from "../services/faiss.js";
import { searchFaiss } from "../services/faiss.js";

const router = express.Router();
const prisma = new PrismaClient();
import { askAI } from "../services/chat.js";

// Example route to get all journal entries
router.get('/entries/:userId', async (req, res) => {
    try {
        const entries = await prisma.journal.findMany({
    where: {
        userId: Number(req.params.userId),
    }
});
        res.status(200).json(entries);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching journal entries',
            issue: err
         });
    }
});

router.post('/entries', async (req, res) => {
    const { title, content, userId } = req.body;

    try {
        // 1️⃣ Add to FAISS (generate embedding + store vector)
        const faissId = await addToFaiss(content);

        // 2️⃣ Save journal in database with FAISS ID
        const newEntry = await prisma.journal.create({
            data: {
                title: title,
                content: content,
                userId: Number(userId),
                faissId: faissId,   // <-- SAVE VECTOR ID
            },
        });

        // 3️⃣ Return response
        res.status(201).json(newEntry);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error creating journal entry' });
    }   
});

router.patch('/entries/:id', async (req,res)=>{
    const {title,content} = req.body;
    const entryId = req.params.id;
    try{
        const updatedEntry = await prisma.journal.update({
            where : {id : Number(entryId)},
            data : {
                title : title,
                content : content
            }
        });
        res.status(200).json(updatedEntry);
    } catch (err) {
        res.status(500).json({ message: 'Error updating journal entry' });
    }
})

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
export default router;

router.post("/entries/chat", async (req, res) => {
    const { query, userId } = req.body;

    try {
        // 1️⃣ Get FAISS results
        const raw = await searchFaiss(query, 5);

        // 2️⃣ Convert into just an array of faissIds (integers)
        const ids = raw.map(r => r.id);

        // 3️⃣ Fetch matching journal entries
        const journals = await prisma.journal.findMany({
            where: {
                userId: Number(userId),
                faissId: { in: ids }
            }
        });

        // 4️⃣ Ask the AI
        const answer = await askAI(query, journals);

        res.json({
            answer,
            memories: journals
        });

    } catch (err) {
        console.error("CHAT ERROR:", err);
        res.status(500).json({ error: "Chat failed", details: err.message });
    }
});
