import axios from 'axios';

const HEX_API_TOKEN = '5b97b8d1945b14acc5c2faed5e314310438e038640df2ff475d357993d0217826b3db99144ebf236d189778cda42898e';
const HEX_PROJECT_ID = '21c6c24a-60e8-487c-b03a-1f04dda4f918';

export class HexService {
    constructor() {
        this.results = {
            dataframe_2: [],
            dataframe_3: null
        };
    }

    async generateReport(workspaceId) {
        try {
            const url = `https://app.hex.tech/api/v1/project/${HEX_PROJECT_ID}/run`;
            
            const response = await axios.post(url, {
                inputParams: {
                    _input_text: workspaceId.toString()
                },
                updatePublishedResults: false,
                useCachedSqlResults: true
            }, {
                headers: {
                    'Authorization': `Bearer ${HEX_API_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.data?.runId) {
                throw new Error('Invalid response from Hex API');
            }

            return {
                success: true,
                runId: response.data.runId,
                data: response.data
            };

        } catch (error) {
            console.error('Error generating Hex report:', error);
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