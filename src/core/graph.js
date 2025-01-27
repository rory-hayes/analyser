export class Graph {
    constructor(nodes = [], links = []) {
        this.nodes = nodes;
        this.links = links;
    }

    addNode(node) {
        if (!this.nodes.find(n => n.id === node.id)) {
            this.nodes.push(node);
        }
    }

    addLink(source, target) {
        if (!this.links.find(l => l.source === source && l.target === target)) {
            this.links.push({ source, target });
        }
    }

    getNodeById(id) {
        return this.nodes.find(node => node.id === id);
    }

    getNodeNeighbors(nodeId) {
        const links = this.links.filter(l => l.source === nodeId || l.target === nodeId);
        return links.map(l => l.source === nodeId ? l.target : l.source);
    }

    calculateDepths() {
        const depths = new Map();
        const visited = new Set();

        const dfs = (nodeId, depth = 0) => {
            if (visited.has(nodeId)) return;
            visited.add(nodeId);
            depths.set(nodeId, depth);

            const neighbors = this.getNodeNeighbors(nodeId);
            neighbors.forEach(neighborId => {
                dfs(neighborId, depth + 1);
            });
        };

        // Start DFS from root nodes (nodes with no incoming edges)
        const rootNodes = this.nodes.filter(node => 
            !this.links.some(link => link.target === node.id)
        );

        rootNodes.forEach(node => dfs(node.id));
        return depths;
    }

    toD3Format() {
        return {
            nodes: this.nodes.map(node => ({
                ...node,
                id: node.id,
                title: node.title || node.id,
                type: node.type || 'page'
            })),
            links: this.links.map(link => ({
                source: link.source,
                target: link.target,
                value: 1
            }))
        };
    }
} 