import { WorkspaceGraph } from '/js/core/workspace-graph.js';
import { MetricsCalculator } from '/js/core/MetricsCalculator.js';
import { GraphVisualizer } from '/js/core/graph-visualizer.js';
import { MetricsDisplay } from '/js/components/MetricsDisplay.js';

class NotionVisualizer {
    constructor() {
        this.workspaceIds = [];
        this.currentGraph = null;
        this.metricsCalculator = new MetricsCalculator();
        this.graphVisualizer = null;
        this.metricsDisplay = null;
        this.eventSource = null;
        this.initializeEventListeners();
        this.initializeGraphVisualizer();
        this.initializeMetricsDisplay();
    }

    initializeEventListeners() {
        const generateBtn = document.getElementById('generateBtn');
        const workspaceInput = document.getElementById('workspaceIds');

        generateBtn.addEventListener('click', () => this.handleGenerate());
        workspaceInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleGenerate();
        });
    }

    async handleGenerate() {
        console.log('handleGenerate called');
        const input = document.getElementById('workspaceIds').value;
        console.log('Input value:', input);
        this.workspaceIds = input.split(',').map(id => id.trim()).filter(Boolean);

        if (this.workspaceIds.length === 0) {
            console.log('No workspace IDs provided');
            this.showError('Please enter at least one workspace ID');
            return;
        }

        console.log('Generating report for workspace:', this.workspaceIds[0]);
        this.showStatus('Generating report...', true);
        await this.generateReport(this.workspaceIds[0]);
    }

    async generateReport(workspaceId) {
        try {
            console.log('Sending request to generate report');
            const response = await fetch('/api/generate-report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ workspaceId })
            });

            console.log('Response received:', response);
            const data = await response.json();
            console.log('Response data:', data);
            if (!data.success) throw new Error(data.error);

            this.showStatus('Report generated, waiting for results...', true);
            this.listenForResults();

        } catch (error) {
            console.error('Error in generateReport:', error);
            this.showError(`Failed to generate report: ${error.message}`);
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

    showStatus(message, showSpinner = false) {
        const status = document.getElementById('status');
        const spinner = document.getElementById('spinner');
        
        if (status) status.textContent = message;
        if (spinner) spinner.style.display = showSpinner ? 'block' : 'none';
    }

    showError(message) {
        const error = document.getElementById('error');
        if (error) {
            error.textContent = message;
            error.style.display = 'block';
            setTimeout(() => {
                error.style.display = 'none';
            }, 5000);
        }
    }

    initializeGraphVisualizer() {
        const container = document.getElementById('graph-container');
        if (container) {
            this.graphVisualizer = new GraphVisualizer(container);
            window.addEventListener('resize', () => this.graphVisualizer.resize());
        }
    }

    initializeMetricsDisplay() {
        const container = document.getElementById('metricsContainer');
        if (container) {
            this.metricsDisplay = new MetricsDisplay(container);
        }
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    window.visualizer = new NotionVisualizer();
}); 