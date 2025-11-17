import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

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
        const newEntry = await prisma.journal.create({
            data: {
                title : title,
                content : content,
                userId : Number(userId),
            },
        });
        res.status(201).json(newEntry);
    } catch (err) {
        res.status(500).json({ message: 'Error creating journal entry' });
    }   
});

export default router;