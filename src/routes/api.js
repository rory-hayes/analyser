import express from 'express';
import axios from 'axios';
import { HexService } from '../services/hexService.js';
import path from 'path';
import fs from 'fs';
import { config } from '../config/config.js';

const router = express.Router();
const hexService = new HexService();

// Generate Report Endpoint
router.post('/generate-report', async (req, res) => {
    try {
        const { workspaceId } = req.body;
        
        console.log('Received generate-report request:', req.body);
        console.log('Workspace ID:', workspaceId);

        if (!workspaceId) {
            console.log('No workspace ID provided');
            return res.status(400).json({ error: 'Workspace ID is required' });
        }

        if (!config.HEX_PROJECT_ID) {
            console.error('HEX_PROJECT_ID is not configured');
            return res.status(500).json({ error: 'Server configuration error' });
        }

        const hexResponse = await hexService.generateReport(workspaceId);
        console.log('Hex API response:', hexResponse);

        res.json(hexResponse);

    } catch (error) {
        console.error('Error in generate-report:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            response: error.response?.data
        });
        res.status(500).json({ 
            error: error.response?.data?.error || error.message || 'Failed to generate report',
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

// Test endpoint
router.get('/test', (req, res) => {
    res.json({
        status: 'ok',
        message: 'API is working',
        timestamp: new Date().toISOString()
    });
});

// Test generate endpoint
router.post('/test-generate', (req, res) => {
    const { workspaceId } = req.body;
    console.log('Test generate called with:', workspaceId);
    res.json({
        success: true,
        message: `Test generate called with workspace ID: ${workspaceId}`,
        timestamp: new Date().toISOString()
    });
});

// Debug file system route
router.get('/debug/files', (req, res) => {
    const files = {
        src: fs.existsSync('src'),
        public: fs.existsSync('public'),
        'public/js': fs.existsSync('public/js'),
        'src/core': fs.existsSync('src/core'),
        'src/components': fs.existsSync('src/components'),
        'public/js/main.js': fs.existsSync('public/js/main.js'),
        'src/core/workspace-graph.js': fs.existsSync('src/core/workspace-graph.js'),
        'src/core/MetricsCalculator.js': fs.existsSync('src/core/MetricsCalculator.js'),
        'src/core/graph-visualizer.js': fs.existsSync('src/core/graph-visualizer.js'),
        'src/components/MetricsDisplay.js': fs.existsSync('src/components/MetricsDisplay.js')
    };
    
    res.json({
        files,
        cwd: process.cwd(),
        env: process.env.NODE_ENV
    });
});

export default router; 