export function calculateWorkspaceScore(data) {
    const metrics = calculateDetailedMetrics(data);
    const weights = {
        structureScore: 0.3,
        organizationScore: 0.3,
        usageScore: 0.2,
        healthScore: 0.2
    };

    return (
        metrics.structureScore * weights.structureScore +
        metrics.organizationScore * weights.organizationScore +
        metrics.usageScore * weights.usageScore +
        metrics.healthScore * weights.healthScore
    ).toFixed(2);
}

export function calculateMaxDepth(data) {
    let maxDepth = 0;
    const visited = new Set();

    function dfs(pageId, depth = 0) {
        if (visited.has(pageId)) return;
        visited.add(pageId);
        maxDepth = Math.max(maxDepth, depth);

        const children = data.filter(page => page.parent_id === pageId);
        children.forEach(child => dfs(child.id, depth + 1));
    }

    // Start DFS from root pages (pages with no parent)
    const rootPages = data.filter(page => !page.parent_id);
    rootPages.forEach(page => dfs(page.id));

    return maxDepth;
}

export function calculateDetailedMetrics(data) {
    const totalPages = data.length;
    const maxDepth = calculateMaxDepth(data);
    const orphanedPages = data.filter(page => !page.parent_id && !page.has_children).length;
    const templates = data.filter(page => page.is_template).length;
    const databases = data.filter(page => page.type === 'database').length;

    return {
        structureScore: calculateStructureScore(maxDepth, totalPages, orphanedPages),
        organizationScore: calculateOrganizationScore(templates, databases, totalPages),
        usageScore: calculateUsageScore(data),
        healthScore: calculateHealthScore(data)
    };
}

export function calculateWorkspaceHealth(data) {
    const metrics = calculateDetailedMetrics(data);
    const healthScore = metrics.healthScore;

    return {
        score: healthScore,
        status: getHealthStatus(healthScore),
        recommendations: generateHealthRecommendations(metrics)
    };
}

export function calculateAnalytics(data) {
    const timeRange = 30; // days
    const now = new Date();
    const thirtyDaysAgo = new Date(now - timeRange * 24 * 60 * 60 * 1000);

    const recentPages = data.filter(page => {
        const createdTime = new Date(page.created_time);
        return createdTime >= thirtyDaysAgo;
    });

    const editedPages = data.filter(page => {
        const lastEditedTime = new Date(page.last_edited_time);
        return lastEditedTime >= thirtyDaysAgo;
    });

    return {
        totalPages: data.length,
        newPagesLast30Days: recentPages.length,
        editedPagesLast30Days: editedPages.length,
        growthRate: (recentPages.length / data.length * 100).toFixed(2),
        activePages: (editedPages.length / data.length * 100).toFixed(2)
    };
}

// Helper functions
function calculateStructureScore(maxDepth, totalPages, orphanedPages) {
    const depthPenalty = Math.max(0, (maxDepth - 5) * 5);
    const orphanPenalty = (orphanedPages / totalPages) * 30;
    return Math.max(0, 100 - depthPenalty - orphanPenalty);
}

function calculateOrganizationScore(templates, databases, totalPages) {
    const templateRatio = (templates / totalPages) * 100;
    const databaseRatio = (databases / totalPages) * 100;
    return Math.min(100, templateRatio * 0.4 + databaseRatio * 0.6);
}

function calculateUsageScore(data) {
    const now = new Date();
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
    
    const activePages = data.filter(page => {
        const lastEditedTime = new Date(page.last_edited_time);
        return lastEditedTime >= thirtyDaysAgo;
    }).length;

    return (activePages / data.length * 100).toFixed(2);
}

function calculateHealthScore(data) {
    const metrics = {
        structureScore: calculateStructureScore(
            calculateMaxDepth(data),
            data.length,
            data.filter(page => !page.parent_id && !page.has_children).length
        ),
        organizationScore: calculateOrganizationScore(
            data.filter(page => page.is_template).length,
            data.filter(page => page.type === 'database').length,
            data.length
        ),
        usageScore: calculateUsageScore(data)
    };

    return (
        metrics.structureScore * 0.4 +
        metrics.organizationScore * 0.3 +
        metrics.usageScore * 0.3
    ).toFixed(2);
}

function getHealthStatus(score) {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Improvement';
}

function generateHealthRecommendations(metrics) {
    const recommendations = [];

    if (metrics.structureScore < 70) {
        recommendations.push('Consider reorganizing your workspace structure to reduce depth and orphaned pages');
    }
    if (metrics.organizationScore < 70) {
        recommendations.push('Add more templates and databases to improve organization');
    }
    if (metrics.usageScore < 70) {
        recommendations.push('Increase workspace engagement by updating and utilizing more pages');
    }

    return recommendations;
} 