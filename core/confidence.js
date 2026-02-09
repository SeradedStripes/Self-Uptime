const Confidence = {
    calculateUptimeConfidence(successfulChecks, totalChecks) {
        if (totalChecks === 0) return 0;
        return Math.round((successfulChecks / totalChecks) * 100);
    },

    calculateConsistencyConfidence(responseTimes) {
        if (responseTimes.length < 2) return 50;

        const mean = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
        const variance = responseTimes.reduce((sum, time) => {
            return sum + Math.pow(time - mean, 2);
        }, 0) / responseTimes.length;
        
        const stdDev = Math.sqrt(variance);
        const coefficientOfVariation = (stdDev / mean) * 100;

        const confidence = Math.max(50, Math.min(100, 100 - coefficientOfVariation));
        return Math.round(confidence);
    },

    calculateOverallConfidence(statusData) {
        if (!statusData) return 0;

        const uptimeScore = Math.round(parseFloat(statusData.uptime) || 0);
        const consistency = this.calculateConsistencyConfidence(statusData.recentResponseTimes || []);
        
        const overallConfidence = Math.round((uptimeScore + consistency) / 2);
        
        return Math.max(0, Math.min(100, overallConfidence));
    },

    getConfidenceLevel(confidence) {
        if (confidence >= 95) return 'Very High';
        if (confidence >= 85) return 'High';
        if (confidence >= 70) return 'Medium';
        if (confidence >= 50) return 'Low';
        return 'Very Low';
    }
};
