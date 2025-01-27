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
        const depths = this.calculateDepths();
        const maxDepth = Math.max(...depths.values());
        const avgDepth = [...depths.values()].reduce((a, b) => a + b, 0) / depths.size;

        return {
            totalNodes: this.nodes.length,
            totalLinks: this.links.length,
            maxDepth,
            avgDepth,
            rootNodes: this.nodes.filter(n => !this.links.some(l => l.target === n.id)).length,
            leafNodes: this.nodes.filter(n => !this.links.some(l => l.source === n.id)).length
        };
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