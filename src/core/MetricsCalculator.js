import { WorkspaceGraph } from './workspace-graph.js';

export class MetricsCalculator {
    constructor() {
        this.DEEP_PAGE_THRESHOLD = 5;
        this.BOTTLENECK_THRESHOLD = 10;
        this.UNFINDABLE_DEPTH = 4;
    }

    calculateAllMetrics(dataframe_2, dataframe_3) {
        // Create workspace graph for structural analysis
        const graph = new WorkspaceGraph(dataframe_2, dataframe_3);
        
        return {
            ...this.calculateStructureMetrics(graph),
            ...this.calculateUsageMetrics(dataframe_3),
            ...this.calculateGrowthMetrics(graph, dataframe_3),
            ...this.calculateOrganizationMetrics(graph, dataframe_3),
            ...this.calculateROIMetrics(dataframe_3)
        };
    }

    calculateStructureMetrics(graph) {
        const graphMetrics = graph.getWorkspaceMetrics();
        const depths = graph.calculateDepths();
        
        return {
            total_pages: graphMetrics.totalNodes,
            max_depth: graphMetrics.maxDepth,
            avg_depth: graphMetrics.avgDepth,
            deep_pages_count: [...depths.values()].filter(d => d > this.DEEP_PAGE_THRESHOLD).length,
            root_pages: graphMetrics.rootNodes,
            orphaned_blocks: this.calculateOrphanedBlocks(graph),
            collections_count: this.countNodesByType(graph, 'collection'),
            linked_database_count: this.countNodesByType(graph, 'linked_database'),
            template_count: this.countNodesByType(graph, 'template'),
            duplicate_count: this.calculateDuplicates(graph),
            bottleneck_count: this.calculateBottlenecks(graph),
            percentage_unlinked: this.calculateUnlinkedPercentage(graph),
            scatter_index: this.calculateScatterIndex(graph),
            unfindable_pages: this.calculateUnfindablePages(graph),
            nav_depth_score: this.calculateNavDepthScore(graphMetrics.avgDepth),
            nav_complexity: this.calculateNavComplexity(graph)
        };
    }

    calculateUsageMetrics(dataframe_3) {
        if (!dataframe_3) return {};

        return {
            total_num_members: dataframe_3.TOTAL_NUM_MEMBERS || 0,
            total_num_guests: dataframe_3.TOTAL_NUM_GUESTS || 0,
            total_num_teamspaces: dataframe_3.TOTAL_NUM_TEAMSPACES || 0,
            total_num_integrations: dataframe_3.TOTAL_NUM_INTEGRATIONS || 0,
            total_num_bots: dataframe_3.TOTAL_NUM_BOTS || 0,
            average_teamspace_members: this.calculateAvgTeamspaceMembers(dataframe_3),
            automation_usage_rate: this.calculateAutomationUsageRate(dataframe_3),
            current_integration_coverage: this.calculateIntegrationCoverage(dataframe_3)
        };
    }

    calculateGrowthMetrics(graph, dataframe_3) {
        const timelineData = graph.getTimelineData();
        const now = Date.now();
        const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);
        
        const recentNodes = timelineData.filter(node => node.timestamp > thirtyDaysAgo);
        const growthRate = (recentNodes.length / timelineData.length) * 100;

        return {
            monthly_member_growth_rate: this.calculateMemberGrowthRate(dataframe_3),
            monthly_content_growth_rate: growthRate,
            growth_capacity: this.calculateGrowthCapacity(growthRate, dataframe_3),
            expected_members_in_next_year: this.calculateExpectedMembers(dataframe_3, growthRate)
        };
    }

    calculateOrganizationMetrics(graph, dataframe_3) {
        if (!dataframe_3) return {};

        const visibilityScore = this.calculateVisibilityScore(dataframe_3);
        const collaborationScore = this.calculateCollaborationScore(dataframe_3);
        const productivityScore = this.calculateProductivityScore(graph, dataframe_3);

        return {
            current_visibility_score: visibilityScore,
            current_collaboration_score: collaborationScore,
            current_productivity_score: productivityScore,
            current_organization_score: (visibilityScore + collaborationScore + productivityScore) / 3
        };
    }

    calculateROIMetrics(dataframe_3) {
        if (!dataframe_3) return {};

        const totalMembers = dataframe_3.TOTAL_NUM_MEMBERS || 0;
        const currentPlan = this.calculatePlanCost(totalMembers, 'team');
        const enterprisePlan = this.calculatePlanCost(totalMembers, 'enterprise');
        const enterprisePlanAI = this.calculatePlanCost(totalMembers, 'enterprise_ai');

        return {
            current_plan: currentPlan,
            enterprise_plan: enterprisePlan,
            enterprise_plan_w_ai: enterprisePlanAI,
            '10_percent_increase': this.calculateProductivityGain(totalMembers, 0.1),
            '20_percent_increase': this.calculateProductivityGain(totalMembers, 0.2),
            '50_percent_increase': this.calculateProductivityGain(totalMembers, 0.5),
            enterprise_plan_roi: this.calculateROI(enterprisePlan, 0.2),
            enterprise_plan_w_ai_roi: this.calculateROI(enterprisePlanAI, 0.5)
        };
    }

    // Helper methods
    calculateOrphanedBlocks(graph) {
        return graph.nodes.filter(node => 
            !graph.getNodeNeighbors(node.id).length
        ).length;
    }

    countNodesByType(graph, type) {
        return graph.nodes.filter(node => node.type === type).length;
    }

    calculateDuplicates(graph) {
        const titleCounts = new Map();
        graph.nodes.forEach(node => {
            if (node.title) {
                titleCounts.set(node.title, (titleCounts.get(node.title) || 0) + 1);
            }
        });
        return Array.from(titleCounts.values()).filter(count => count > 1).length;
    }

    calculateBottlenecks(graph) {
        return graph.nodes.filter(node => 
            graph.getNodeNeighbors(node.id).length > this.BOTTLENECK_THRESHOLD
        ).length;
    }

    calculateUnlinkedPercentage(graph) {
        const orphaned = this.calculateOrphanedBlocks(graph);
        return (orphaned / graph.nodes.length) * 100;
    }

    calculateScatterIndex(graph) {
        const rootNodes = graph.nodes.filter(node => 
            !graph.links.some(link => link.target === node.id)
        ).length;
        return rootNodes / graph.nodes.length;
    }

    calculateUnfindablePages(graph) {
        const depths = graph.calculateDepths();
        return [...depths.values()].filter(depth => depth > this.UNFINDABLE_DEPTH).length;
    }

    calculateNavDepthScore(avgDepth) {
        return Math.max(0, 100 - (avgDepth * 10));
    }

    calculateNavComplexity(graph) {
        const bottlenecks = this.calculateBottlenecks(graph);
        const unfindable = this.calculateUnfindablePages(graph);
        return ((bottlenecks * 5 + unfindable * 3) / graph.nodes.length) * 100;
    }

    // Additional helper methods for usage metrics
    calculateAvgTeamspaceMembers(dataframe_3) {
        const teamspaces = dataframe_3.TOTAL_NUM_TEAMSPACES || 1;
        const members = dataframe_3.TOTAL_NUM_MEMBERS || 0;
        return members / teamspaces;
    }

    calculateAutomationUsageRate(dataframe_3) {
        const members = dataframe_3.TOTAL_NUM_MEMBERS || 1;
        const bots = dataframe_3.TOTAL_NUM_BOTS || 0;
        return (bots / members) * 100;
    }

    calculateIntegrationCoverage(dataframe_3) {
        const integrations = dataframe_3.TOTAL_NUM_INTEGRATIONS || 0;
        return (integrations / 5) * 100; // 5 is the recommended number of integrations
    }

    // ROI calculation helpers
    calculatePlanCost(members, plan) {
        const rates = {
            team: 10,
            enterprise: 20,
            enterprise_ai: 25
        };
        return members * rates[plan] * 12;
    }

    calculateProductivityGain(members, improvement) {
        const avgSalary = 80000;
        const workingHours = 2080;
        const hourlyRate = avgSalary / workingHours;
        return members * workingHours * hourlyRate * improvement;
    }

    calculateROI(cost, improvement) {
        const gain = this.calculateProductivityGain(cost, improvement);
        return ((gain - cost) / cost) * 100;
    }
} 