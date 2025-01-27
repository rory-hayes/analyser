import * as d3 from 'd3';

export class GraphVisualizer {
    constructor(container, options = {}) {
        this.container = container;
        this.options = {
            width: options.width || container.clientWidth,
            height: options.height || container.clientHeight,
            nodeRadius: options.nodeRadius || 8,
            linkDistance: options.linkDistance || 100,
            colors: {
                page: '#4F46E5',
                collection: '#10B981',
                database: '#F59E0B',
                template: '#8B5CF6',
                default: '#6B7280'
            },
            ...options
        };

        this.svg = null;
        this.simulation = null;
        this.zoom = null;
        this.tooltip = null;
        this.timeline = null;

        this.initializeVisualization();
    }

    initializeVisualization() {
        // Clear existing content
        this.container.innerHTML = '';

        // Create SVG
        this.svg = d3.select(this.container)
            .append('svg')
            .attr('width', '100%')
            .attr('height', '100%')
            .attr('viewBox', [0, 0, this.options.width, this.options.height])
            .attr('class', 'graph-svg');

        // Add zoom behavior
        this.zoom = d3.zoom()
            .scaleExtent([0.1, 4])
            .on('zoom', (event) => {
                this.svg.select('g').attr('transform', event.transform);
            });

        this.svg.call(this.zoom);

        // Create tooltip
        this.tooltip = d3.select(this.container)
            .append('div')
            .attr('class', 'tooltip')
            .style('opacity', 0);

        // Add controls
        this.addControls();
    }

    addControls() {
        const controls = d3.select(this.container)
            .append('div')
            .attr('class', 'graph-controls');

        // Zoom controls
        controls.append('button')
            .attr('class', 'graph-control-button')
            .html('<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>')
            .on('click', () => this.zoomIn());

        controls.append('button')
            .attr('class', 'graph-control-button')
            .html('<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"/></svg>')
            .on('click', () => this.zoomOut());

        controls.append('button')
            .attr('class', 'graph-control-button')
            .html('<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"/></svg>')
            .on('click', () => this.resetZoom());
    }

    visualize(graph) {
        // Implementation will use D3.js
        console.log('Visualizing graph:', graph);
    }

    getNodeColor(type) {
        return this.options.colors[type] || this.options.colors.default;
    }

    drag() {
        return d3.drag()
            .on('start', (event, d) => {
                if (!event.active) this.simulation.alphaTarget(0.3).restart();
                d.fx = d.x;
                d.fy = d.y;
            })
            .on('drag', (event, d) => {
                d.fx = event.x;
                d.fy = event.y;
            })
            .on('end', (event, d) => {
                if (!event.active) this.simulation.alphaTarget(0);
                d.fx = null;
                d.fy = null;
            });
    }

    handleNodeMouseOver(event, d) {
        this.tooltip
            .style('opacity', 1)
            .html(this.createTooltipContent(d))
            .style('left', (event.pageX + 10) + 'px')
            .style('top', (event.pageY - 10) + 'px');
    }

    handleNodeMouseOut(event, d) {
        this.tooltip.style('opacity', 0);
    }

    handleNodeClick(event, d) {
        // Handle node click - could open the page in Notion, etc.
        if (d.url) {
            window.open(d.url, '_blank');
        }
    }

    createTooltipContent(node) {
        return `
            <div class="p-2">
                <strong class="block text-lg mb-1">${node.title}</strong>
                <span class="block text-sm text-gray-500">Type: ${node.type}</span>
                ${node.createdTime ? 
                    `<span class="block text-sm text-gray-500">Created: ${new Date(node.createdTime).toLocaleDateString()}</span>` 
                    : ''}
                ${node.url ? 
                    `<a href="${node.url}" target="_blank" class="block mt-2 text-blue-500 hover:text-blue-700">Open in Notion</a>` 
                    : ''}
            </div>
        `;
    }

    addTimeline(timelineData) {
        if (this.timeline) {
            this.timeline.remove();
        }

        const margin = { top: 10, right: 30, bottom: 30, left: 30 };
        const width = this.options.width - margin.left - margin.right;
        const height = 100 - margin.top - margin.bottom;

        this.timeline = d3.select(this.container)
            .append('div')
            .attr('class', 'timeline-container')
            .append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // Create scales
        const x = d3.scaleTime()
            .domain(d3.extent(timelineData, d => new Date(d.timestamp)))
            .range([0, width]);

        const y = d3.scaleLinear()
            .domain([0, d3.max(timelineData, d => d.count)])
            .range([height, 0]);

        // Add axes
        this.timeline.append('g')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(x));

        // Add the line
        this.timeline.append('path')
            .datum(timelineData)
            .attr('fill', 'none')
            .attr('stroke', '#4F46E5')
            .attr('stroke-width', 1.5)
            .attr('d', d3.line()
                .x(d => x(new Date(d.timestamp)))
                .y(d => y(d.count))
            );
    }

    zoomIn() {
        this.svg.transition().call(
            this.zoom.scaleBy,
            2
        );
    }

    zoomOut() {
        this.svg.transition().call(
            this.zoom.scaleBy,
            0.5
        );
    }

    resetZoom() {
        this.svg.transition().call(
            this.zoom.transform,
            d3.zoomIdentity
        );
    }

    resize() {
        this.width = this.container.clientWidth;
        this.height = this.container.clientHeight;
        this.svg
            .attr('width', this.options.width)
            .attr('height', this.options.height)
            .attr('viewBox', [0, 0, this.options.width, this.options.height]);
        
        if (this.simulation) {
            this.simulation
                .force('center', d3.forceCenter(this.options.width / 2, this.options.height / 2))
                .restart();
        }
    }
} 