import express from 'express';
import axios from 'axios';
import { HexService } from '../services/hexService.js';

const router = express.Router();
const HEX_API_TOKEN = '5b97b8d1945b14acc5c2faed5e314310438e038640df2ff475d357993d0217826b3db99144ebf236d189778cda42898e';
const hexService = new HexService();

// Generate Report Endpoint
router.post('/generate-report', async (req, res) => {
    try {
        const { workspaceId } = req.body;
        
        console.log('Received generate-report request:', req.body);

        if (!workspaceId) {
            return res.status(400).json({ error: 'Workspace ID is required' });
        }

        const hexResponse = await hexService.generateReport(workspaceId);
        console.log('Hex API response:', hexResponse);

        res.json(hexResponse);

    } catch (error) {
        console.error('Error in generate-report:', error);
        res.status(500).json({ 
            error: error.message || 'Failed to generate report',
            details: error.response?.data
        });
    }
});

// Results streaming endpoint
router.get('/hex-results/stream', (req, res) => {
    try {
        // Set SSE headers
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
        });

        // Initialize results handler
        hexService.handleResultsStream(res);

    } catch (error) {
        console.error('Error in hex-results stream:', error);
        res.status(500).end();
    }
});

// Health check endpoint
router.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy',
        environment: process.env.NODE_ENV,
        timestamp: new Date().toISOString()
    });
});

export default router; 