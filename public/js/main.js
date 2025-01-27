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
        
        // Initialize after DOM is loaded
        this.initializeVisualizers();
        this.initializeEventListeners();
    }

    initializeVisualizers() {
        const graphContainer = document.getElementById('graph-container');
        const metricsContainer = document.getElementById('metricsContainer');

        if (graphContainer) {
            this.graphVisualizer = new GraphVisualizer(graphContainer);
        }
        
        if (metricsContainer) {
            this.metricsDisplay = new MetricsDisplay(metricsContainer);
        }
    }

    initializeEventListeners() {
        // Get button and input elements
        const generateBtn = document.getElementById('generateBtn');
        const workspaceInput = document.getElementById('workspaceIds');

        if (!generateBtn || !workspaceInput) {
            console.error('Required elements not found:', {
                generateBtn: !!generateBtn,
                workspaceInput: !!workspaceInput
            });
            return;
        }

        // Add click event listener
        generateBtn.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Generate button clicked');
            this.handleGenerate();
        });

        // Add enter key event listener
        workspaceInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                console.log('Enter key pressed');
                this.handleGenerate();
            }
        });
    }

    async handleGenerate() {
        console.log('handleGenerate called');
        
        // Get input value
        const input = document.getElementById('workspaceIds').value;
        console.log('Input value:', input);

        if (!input) {
            this.showError('Please enter a workspace ID');
            return;
        }

        // Show status section
        const statusSection = document.getElementById('statusSection');
        if (statusSection) {
            statusSection.classList.remove('hidden');
        }

        try {
            // Make API request
            const response = await fetch('/api/generate-report', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ workspaceId: input })
            });

            console.log('API Response:', response);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Response data:', data);

            if (data.success) {
                this.showStatus('Report generated successfully, fetching results...');
                this.listenForResults();
            } else {
                throw new Error(data.error || 'Failed to generate report');
            }

        } catch (error) {
            console.error('Error generating report:', error);
            this.showError(`Error: ${error.message}`);
        }
    }

    listenForResults() {
        if (this.eventSource) {
            this.eventSource.close();
        }

        this.eventSource = new EventSource('/api/hex-results/stream');
        
        this.eventSource.onmessage = (event) => {
            const data = JSON.parse(event.data);
            
            if (data.type === 'connected') {
                console.log('Connected to results stream');
            } else if (data.type === 'data') {
                this.handleResultChunk(data);
            } else if (data.type === 'error') {
                this.showError(data.message);
                this.eventSource.close();
            }
        };

        this.eventSource.onerror = () => {
            this.showError('Lost connection to server');
            this.eventSource.close();
        };
    }

    handleResultChunk(data) {
        this.updateProgress(data);

        if (data.isLastChunk) {
            this.processCompleteResults(data.data);
            this.eventSource.close();
        }
    }

    processCompleteResults(data) {
        // Create workspace graph
        this.currentGraph = new WorkspaceGraph(data.dataframe_2, data.dataframe_3);
        
        // Calculate metrics
        const metrics = this.metricsCalculator.calculateAllMetrics(
            data.dataframe_2,
            data.dataframe_3
        );

        // Update UI
        this.updateVisualization();
        this.updateMetricsDisplay(metrics);
        this.showStatus('Analysis complete');
    }

    updateVisualization() {
        if (!this.currentGraph) return;

        if (this.graphVisualizer) {
            this.graphVisualizer.visualize(this.currentGraph);
        }
    }

    updateMetricsDisplay(metrics) {
        if (this.metricsDisplay) {
            this.metricsDisplay.displayMetrics(metrics);
        }
    }

    updateProgress(data) {
        const progress = document.getElementById('progress');
        if (!progress) return;

        const percentage = (data.recordsProcessed / data.totalRecords) * 100;
        progress.style.width = `${percentage}%`;
        progress.textContent = `${Math.round(percentage)}%`;
    }

    showStatus(message) {
        const status = document.getElementById('status');
        if (status) {
            status.textContent = message;
        }
        console.log('Status:', message);
    }

    showError(message) {
        const errorDiv = document.getElementById('error');
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.classList.remove('hidden');
            setTimeout(() => {
                errorDiv.classList.add('hidden');
            }, 5000);
        }
        console.error('Error:', message);
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing NotionVisualizer');
    window.visualizer = new NotionVisualizer();
}); 