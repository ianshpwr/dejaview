import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import journalRoutes from './routes/journal.js'

const app = express();

const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
}));

app.use(express.json());

app.use('/auth', authRoutes);
app.use('/journal',journalRoutes);

// Health check — verify backend is running
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        time: new Date().toISOString(),
        db: 'connected',
    });
});

// JSON 404 fallback — must be last middleware
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

export default app;