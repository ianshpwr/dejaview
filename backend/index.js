import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import journalRoutes from './routes/journal.js'

const app = express();

const PORT = process.env.PORT || 5000;

app.use(cors());

app.use(express.json());

app.use('/auth', authRoutes);
app.use('/journal',journalRoutes);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

export default app;