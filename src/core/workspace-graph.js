import { Graph } from './graph.js';

export class WorkspaceGraph extends Graph {
    constructor(dataframe_2 = [], dataframe_3 = null) {
        super();
        this.workspaceData = {
            dataframe_2,
            dataframe_3
        };
        this.initializeFromDataframes();
    }

    initializeFromDataframes() {
        if (!this.workspaceData.dataframe_2?.length) return;

        // Create nodes from dataframe_2
        this.workspaceData.dataframe_2.forEach(row => {
            this.addNode({
                id: row.ID,
                title: row.TEXT || 'Untitled',
                type: row.TYPE || 'page',
                createdTime: row.CREATED_TIME ? new Date(parseInt(row.CREATED_TIME)) : null,
                depth: row.DEPTH || 0,
                parent: row.PARENT_ID
            });

            // Add link if there's a parent
            if (row.PARENT_ID) {
                this.addLink(row.PARENT_ID, row.ID);
            }
        });
    }

    getWorkspaceMetrics() {
        return {
            totalNodes: this.nodes.length,
            maxDepth: this.calculateMaxDepth(),
            avgDepth: this.calculateAverageDepth(),
            rootNodes: this.getRootNodes().length
        };
    }

    calculateMaxDepth() {
        return Math.max(...this.nodes.map(node => node.depth || 0));
    }

    calculateAverageDepth() {
        const depths = this.nodes.map(node => node.depth || 0);
        return depths.reduce((a, b) => a + b, 0) / depths.length;
    }

    getRootNodes() {
        return this.nodes.filter(node => !node.parent_id);
    }

    getTimelineData() {
        return this.nodes
            .filter(node => node.createdTime)
            .sort((a, b) => a.createdTime - b.createdTime)
            .map(node => ({
                id: node.id,
                title: node.title,
                type: node.type,
                timestamp: node.createdTime.getTime()
            }));
    }
} 