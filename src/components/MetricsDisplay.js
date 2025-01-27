export class MetricsDisplay {
    constructor(container) {
        this.container = container;
    }

    displayMetrics(metrics) {
        this.container.innerHTML = this.createMetricsHTML(metrics);
    }

    createMetricsHTML(metrics) {
        return `
            <div class="metrics-grid">
                ${this.createMetricCard('Total Pages', metrics.totalPages)}
                ${this.createMetricCard('Organization Score', metrics.organizationScore.score)}
                ${this.createMetricCard('Activity Score', metrics.activityScore.score)}
                ${this.createMetricCard('Health Score', metrics.healthMetrics.healthScore)}
            </div>
        `;
    }

    createMetricCard(title, value) {
        return `
            <div class="metric-card">
                <div class="metric-header">
                    <h3 class="metric-title">${title}</h3>
                </div>
                <div class="metric-value">${value}</div>
            </div>
        `;
    }

    createMetricCard(metric) {
        return `
            <div class="metric-card">
                <div class="metric-header">
                    ${this.getMetricIcon(metric.type)}
                    <span class="metric-title">${metric.title}</span>
                </div>
                <div class="metric-value">${this.formatValue(metric.value, metric.format)}</div>
                <div class="metric-description">${metric.description}</div>
                ${metric.trend ? this.createTrendIndicator(metric.trend) : ''}
            </div>
        `;
    }

    formatValue(value, format = 'number') {
        switch (format) {
            case 'number':
                return new Intl.NumberFormat().format(value);
            case 'percentage':
                return `${value.toFixed(1)}%`;
            case 'currency':
                return new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                    minimumFractionDigits: 0
                }).format(value);
            default:
                return value;
        }
    }

    createTrendIndicator(trend) {
        const isPositive = trend.value > 0;
        const trendClass = isPositive ? 'trend-up' : 'trend-down';
        const icon = isPositive ? 
            '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>' :
            '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6"/></svg>';

        return `
            <div class="metric-trend ${trendClass}">
                ${icon}
                <span class="ml-1">${Math.abs(trend.value)}% ${trend.label}</span>
            </div>
        `;
    }

    getMetricIcon(type) {
        const icons = {
            structure: '<svg class="metric-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>',
            usage: '<svg class="metric-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>',
            growth: '<svg class="metric-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>',
            roi: '<svg class="metric-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>'
        };
        return icons[type] || icons.structure;
    }

    organizeMetrics(metrics) {
        return {
            totalPages: {
                type: 'structure',
                title: 'Total Pages',
                value: metrics.total_pages,
                format: 'number',
                description: 'Total number of pages in the workspace'
            },
            activeUsers: {
                type: 'usage',
                title: 'Active Users',
                value: metrics.total_num_members,
                format: 'number',
                description: 'Number of active users in the last 30 days'
            },
            growthRate: {
                type: 'growth',
                title: 'Monthly Growth Rate',
                value: metrics.monthly_content_growth_rate,
                format: 'percentage',
                description: 'Content growth rate over the last 30 days',
                trend: {
                    value: metrics.monthly_content_growth_rate,
                    label: 'vs last month'
                }
            },
            organizationScore: {
                type: 'structure',
                title: 'Organization Score',
                value: metrics.current_organization_score,
                format: 'percentage',
                description: 'Overall workspace organization score'
            },
            roi: {
                type: 'roi',
                title: 'Potential ROI',
                value: metrics.enterprise_plan_w_ai_roi,
                format: 'percentage',
                description: 'Projected return on investment with Enterprise AI',
                trend: {
                    value: metrics.enterprise_plan_w_ai_roi - metrics.enterprise_plan_roi,
                    label: 'vs standard plan'
                }
            }
        };
    }
} 