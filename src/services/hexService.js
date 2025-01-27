import axios from 'axios';
import { config } from '../config/config.js';

export class HexService {
    constructor() {
        this.results = new Map();
    }

    async generateReport(workspaceId, projectId) {
        try {
            console.log('Generating report for workspace:', workspaceId);
            const response = await axios.post(`https://api.hex.tech/v1/projects/${projectId}/runs`, {
                parameters: {
                    workspace_id: workspaceId
                }
            }, {
                headers: {
                    'Authorization': `Bearer ${config.HEX_API_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('Hex API response:', response.data);
            return {
                success: true,
                runId: response.data.run_id
            };

        } catch (error) {
            console.error('Error in generateReport:', error);
            console.error('Error details:', {
                status: error.response?.status,
                data: error.response?.data,
                message: error.message
            });
            throw error;
        }
    }

    handleResultsStream(res) {
        let processingState = {
            lastProcessedIndex: 0,
            totalRecordsSent: 0,
            isProcessing: false
        };

        // Send initial connection message
        res.write('data: {"type":"connected"}\n\n');

        const checkResults = async () => {
            if (processingState.isProcessing) return;

            try {
                processingState.isProcessing = true;
                
                // Process results in chunks
                const CHUNK_SIZE = 500;
                const currentChunk = this.results.dataframe_2.slice(
                    processingState.lastProcessedIndex,
                    processingState.lastProcessedIndex + CHUNK_SIZE
                );

                if (currentChunk.length > 0) {
                    const chunkData = {
                        type: 'data',
                        data: {
                            dataframe_2: currentChunk,
                            dataframe_3: processingState.lastProcessedIndex + CHUNK_SIZE >= this.results.dataframe_2.length ? 
                                this.results.dataframe_3 : null
                        },
                        currentChunk: Math.floor(processingState.lastProcessedIndex / CHUNK_SIZE) + 1,
                        totalChunks: Math.ceil(this.results.dataframe_2.length / CHUNK_SIZE),
                        recordsProcessed: processingState.lastProcessedIndex + currentChunk.length,
                        totalRecords: this.results.dataframe_2.length,
                        isLastChunk: processingState.lastProcessedIndex + CHUNK_SIZE >= this.results.dataframe_2.length
                    };

                    res.write(`data: ${JSON.stringify(chunkData)}\n\n`);
                    processingState.lastProcessedIndex += CHUNK_SIZE;
                }

                processingState.isProcessing = false;
            } catch (error) {
                console.error('Error processing results:', error);
                res.write(`data: {"type":"error","message":"${error.message}"}\n\n`);
                processingState.isProcessing = false;
            }
        };

        // Check for results periodically
        const interval = setInterval(checkResults, 1000);

        // Fix: Use res.on instead of req.on
        res.on('close', () => {
            clearInterval(interval);
            this.clearResults(); // Clear results when connection closes
        });
    }

    addResults(data) {
        if (data?.dataframe_2) {
            this.results.dataframe_2 = this.results.dataframe_2.concat(data.dataframe_2);
        }
        if (data?.dataframe_3) {
            this.results.dataframe_3 = data.dataframe_3;
        }
    }

    clearResults() {
        this.results = {
            dataframe_2: [],
            dataframe_3: null
        };
    }
} 