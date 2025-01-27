import { WorkspaceGraph } from './core/workspace-graph.js';
import { MetricsCalculator } from './core/MetricsCalculator.js';
import { GraphVisualizer } from './core/graph-visualizer.js';
import { MetricsDisplay } from './components/MetricsDisplay.js';

class NotionVisualizer {
    constructor() {
        this.workspaceIds = [];
        this.currentGraph = null;
        this.metricsCalculator = new MetricsCalculator();
        this.graphVisualizer = null;
        this.metricsDisplay = null;
        this.eventSource = null;
        
        this.initialize();
    }

    initialize() {
        const graphContainer = document.getElementById('graph-container');
        const metricsContainer = document.getElementById('metricsContainer');
        const generateBtn = document.getElementById('generateBtn');
        const workspaceInput = document.getElementById('workspaceIds');

        if (graphContainer) {
            this.graphVisualizer = new GraphVisualizer(graphContainer);
        }
        
        if (metricsContainer) {
            this.metricsDisplay = new MetricsDisplay(metricsContainer);
        }

        if (generateBtn) {
            generateBtn.addEventListener('click', async () => {
                try {
                    const workspaceIds = workspaceInput.value.split(',')
                        .map(id => id.trim())
                        .filter(Boolean);
                    
                    if (workspaceIds.length === 0) {
                        this.showError('Please enter at least one workspace ID');
                        return;
                    }

                    this.showStatus('Initiating report generation...', true);
                    
                    for (const workspaceId of workspaceIds) {
                        await this.processWorkspace(workspaceId);
                    }
                } catch (error) {
                    console.error('Error generating report:', error);
                    this.showError('Error generating report. Please try again.');
                }
            });
        }
    }

    // ... rest of the class implementation ...
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing NotionVisualizer');
    window.visualizer = new NotionVisualizer();
}); 