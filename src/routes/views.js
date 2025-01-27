import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Landing Page
router.get('/', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'public', 'index.html'));
});

// Metrics Page
router.get('/metrics', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'public', 'metrics.html'));
});

// Analytics Page
router.get('/analytics', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'public', 'analytics.html'));
});

// Insights Page
router.get('/insights', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'public', 'insights.html'));
});

// Visualizer Page
router.get('/visualizer', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'public', 'visualizer.html'));
});

export default router; 