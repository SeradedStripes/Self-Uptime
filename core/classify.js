(function (global) {
    if (global.Classify) {
        return;
    }

    const Classify = {
    classifyStatus(statusData) {
        if (!statusData) return 'unknown';

        const status = statusData.status?.toLowerCase() || 'unknown';
        const uptime = parseFloat(statusData.uptime) || 0;
        const responseTime = statusData.responseTime || 0;

        if (status === 'offline' || status === 'critical') return 'critical';

        if (status === 'degraded') return 'degraded';

        if (responseTime >= 1000) return 'degraded';

        if (uptime >= 99 && responseTime < 500) return 'healthy';

        if (uptime >= 95 && responseTime < 1000) return 'degraded';

        if (uptime >= 90) return 'degraded';

        if (uptime < 90) return 'critical';

        return 'unknown';
    },

    getStatusClass(classification) {
        const classes = {
            'healthy': 'status-healthy',
            'degraded': 'status-degraded',
            'critical': 'status-critical',
            'unknown': 'status-unknown'
        };
        return classes[classification] || 'status-unknown';
    },

    getStatusMessage(classification) {
        const messages = {
            'healthy': 'Operational',
            'degraded': 'Degraded',
            'critical': 'Down',
            'unknown': 'Unknown'
        };
        return messages[classification] || 'Unknown';
    },

    getStatusColor(classification) {
        const colors = {
            'healthy': '#28a745',
            'degraded': '#ffc107',
            'critical': '#dc3545',
            'unknown': '#6c757d'
        };
        return colors[classification] || '#6c757d';
    }
    };

    global.Classify = Classify;
})(typeof window !== 'undefined' ? window : globalThis);
