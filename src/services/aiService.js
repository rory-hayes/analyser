export class AIInsightsService {
    constructor() {
        this.insights = [];
    }

    async generateInsights(data) {
        try {
            // Basic insights generation
            const insights = {
                structureInsights: this.analyzeStructure(data),
                usageInsights: this.analyzeUsage(data),
                organizationInsights: this.analyzeOrganization(data)
            };

            this.insights = insights;
            return insights;
        } catch (error) {
            console.error('Error generating AI insights:', error);
            throw error;
        }
    }

    analyzeStructure(data) {
        const maxDepth = Math.max(...data.map(page => page.depth || 0));
        const orphanedPages = data.filter(page => !page.parent_id && !page.has_children).length;

        return {
            maxDepth,
            orphanedPages,
            recommendations: this.generateStructureRecommendations(maxDepth, orphanedPages)
        };
    }

    analyzeUsage(data) {
        const now = new Date();
        const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
        
        const recentlyActive = data.filter(page => {
            const lastEdited = new Date(page.last_edited_time);
            return lastEdited >= thirtyDaysAgo;
        }).length;

        return {
            activePages: recentlyActive,
            activityRate: (recentlyActive / data.length * 100).toFixed(2),
            recommendations: this.generateUsageRecommendations(recentlyActive, data.length)
        };
    }

    analyzeOrganization(data) {
        const templates = data.filter(page => page.is_template).length;
        const databases = data.filter(page => page.type === 'database').length;

        return {
            templates,
            databases,
            recommendations: this.generateOrganizationRecommendations(templates, databases, data.length)
        };
    }

    generateStructureRecommendations(maxDepth, orphanedPages) {
        const recommendations = [];

        if (maxDepth > 5) {
            recommendations.push('Consider flattening your workspace structure to improve navigation');
        }
        if (orphanedPages > 0) {
            recommendations.push('Link or archive orphaned pages to maintain workspace organization');
        }

        return recommendations;
    }

    generateUsageRecommendations(activePages, totalPages) {
        const recommendations = [];
        const activityRate = (activePages / totalPages) * 100;

        if (activityRate < 50) {
            recommendations.push('Encourage more regular updates to keep content fresh');
        }
        if (activityRate < 30) {
            recommendations.push('Consider archiving or removing outdated content');
        }

        return recommendations;
    }

    generateOrganizationRecommendations(templates, databases, totalPages) {
        const recommendations = [];
        const templateRatio = (templates / totalPages) * 100;
        const databaseRatio = (databases / totalPages) * 100;

        if (templateRatio < 10) {
            recommendations.push('Create more templates to standardize content creation');
        }
        if (databaseRatio < 15) {
            recommendations.push('Consider using more databases to organize structured data');
        }

        return recommendations;
    }
} 