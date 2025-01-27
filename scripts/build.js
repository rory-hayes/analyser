import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

// Ensure directories exist
const dirs = [
    'public/core',
    'public/components',
    'public/services',
    'public/utils',
    'public/config'
];

// Create directories
dirs.forEach(dir => {
    const fullPath = path.join(rootDir, dir);
    if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
        console.log(`Created directory: ${fullPath}`);
    }
});

// Copy files
const filesToCopy = [
    { from: 'src/core/workspace-graph.js', to: 'public/core/workspace-graph.js' },
    { from: 'src/core/graph-visualizer.js', to: 'public/core/graph-visualizer.js' },
    { from: 'src/core/MetricsCalculator.js', to: 'public/core/MetricsCalculator.js' },
    { from: 'src/components/MetricsDisplay.js', to: 'public/components/MetricsDisplay.js' },
    { from: 'src/services/hexService.js', to: 'public/services/hexService.js' },
    { from: 'src/config/config.js', to: 'public/config/config.js' },
    { from: 'old/Graph.js', to: 'public/core/graph-visualizer.js' },
    { from: 'old/MetricsCalculator.js', to: 'public/core/MetricsCalculator.js' },
    { from: 'old/workspace-graph.js', to: 'public/core/workspace-graph.js' }
];

// Copy each file
filesToCopy.forEach(({ from, to }) => {
    const sourcePath = path.join(rootDir, from);
    const destPath = path.join(rootDir, to);
    
    if (fs.existsSync(sourcePath)) {
        fs.copyFileSync(sourcePath, destPath);
        console.log(`Copied: ${from} -> ${to}`);
    } else {
        console.error(`Source file not found: ${from}`);
    }
});

console.log('Build complete!'); 