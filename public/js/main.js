import { WorkspaceGraph } from '../src/core/workspace-graph.js';
import { MetricsCalculator } from '../src/core/MetricsCalculator.js';
import { GraphVisualizer } from '../src/core/graph-visualizer.js';
import { MetricsDisplay } from '../src/components/MetricsDisplay.js';

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

                    // Show status section and spinner
                    this.showStatus('Initiating report generation...', true);
                    
                    // Process each workspace ID
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

    async processWorkspace(workspaceId) {
        try {
            if (!workspaceId) {
                throw new Error('Workspace ID is required');
            }

            this.showStatus('Checking server status...', true);
            
            const isServerHealthy = await this.checkServerStatus();
            if (!isServerHealthy) {
                this.showStatus('Server is not responding. Please try again later.');
                return;
            }

            // Trigger Hex report
            this.showStatus(`Triggering report for workspace ${workspaceId}...`, true);

            const response = await fetch('/api/generate-report', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ workspaceId: workspaceId.trim() })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to trigger report');
            }

            if (!data.success || !data.runId) {
                throw new Error('Invalid response from server');
            }

            console.log('Report generation triggered:', {
                success: data.success,
                runId: data.runId
            });

            this.showStatus(`Report triggered for workspace ${workspaceId}. Waiting for results...`, true);
            
            // Start listening for results
            this.listenForResults();

        } catch (error) {
            console.error('Error processing workspace:', error);
            let errorMessage = error.message;
            
            // Add more context for specific errors
            if (errorMessage.includes('Hex API Error')) {
                errorMessage += '. Please check your Hex API configuration.';
            } else if (errorMessage.includes('Invalid Hex API key')) {
                errorMessage = 'API key is invalid or expired. Please update your configuration.';
            } else if (errorMessage.includes('Hex project not found')) {
                errorMessage = 'Hex project configuration is incorrect. Please verify the project ID.';
            }
            
            this.showStatus(`Error processing workspace ${workspaceId}: ${errorMessage}`, false);
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

    showStatus(message, isLoading) {
        const status = document.getElementById('status');
        if (status) {
            status.textContent = message;
        }
        console.log('Status:', message);

        if (isLoading) {
            const spinner = document.getElementById('spinner');
            if (spinner) {
                spinner.classList.remove('hidden');
            }
        } else {
            const spinner = document.getElementById('spinner');
            if (spinner) {
                spinner.classList.add('hidden');
            }
        }
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

    async checkServerStatus() {
        // Implementation of checkServerStatus method
        // This is a placeholder and should be replaced with the actual implementation
        return true; // Placeholder return, actual implementation needed
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing NotionVisualizer');
    window.visualizer = new NotionVisualizer();
}); 