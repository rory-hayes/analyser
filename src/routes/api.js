import express from 'express';
import axios from 'axios';
import { HexService } from '../services/hexService.js';
import path from 'path';
import fs from 'fs';

const router = express.Router();
const HEX_API_TOKEN = '5b97b8d1945b14acc5c2faed5e314310438e038640df2ff475d357993d0217826b3db99144ebf236d189778cda42898e';
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
    const publicDir = path.join(process.cwd(), 'public');
    const files = [];
    
    function walkDir(dir) {
        const items = fs.readdirSync(dir);
        items.forEach(item => {
            const fullPath = path.join(dir, item);
            const stat = fs.statSync(fullPath);
            if (stat.isDirectory()) {
                walkDir(fullPath);
            } else {
                files.push({
                    path: fullPath.replace(publicDir, ''),
                    size: stat.size,
                    modified: stat.mtime
                });
            }
        });
    }
    
    try {
        walkDir(publicDir);
        res.json({ 
            root: publicDir,
            files,
            env: process.env.NODE_ENV
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router; 