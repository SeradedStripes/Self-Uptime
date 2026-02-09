(function (global) {
    if (global.Timing) {
        return;
    }

    const Timing = {
    measurements: {},

    startTimer(service) {
        const startTime = performance.now();
        if (!this.measurements[service]) {
            this.measurements[service] = [];
        }
        return startTime;
    },

    endTimer(service, startTime) {
        const endTime = performance.now();
        const elapsed = endTime - startTime;

        if (!this.measurements[service]) {
            this.measurements[service] = [];
        }

        this.measurements[service].push(elapsed);

        if (this.measurements[service].length > 100) {
            this.measurements[service].shift();
        }

        return elapsed;
    },

    getAverageResponseTime(service) {
        if (!this.measurements[service] || this.measurements[service].length === 0) {
            return 0;
        }

        const sum = this.measurements[service].reduce((a, b) => a + b, 0);
        return Math.round(sum / this.measurements[service].length);
    },

    getMeasurements(service) {
        return this.measurements[service] || [];
    },

    getMinMaxResponseTime(service) {
        const measurements = this.measurements[service];
        if (!measurements || measurements.length === 0) {
            return { min: 0, max: 0 };
        }

        return {
            min: Math.min(...measurements),
            max: Math.max(...measurements)
        };
    },

    formatTime(ms) {
        if (ms < 1000) {
            return Math.round(ms) + 'ms';
        }
        return (ms / 1000).toFixed(2) + 's';
    },

    clearAll() {
        this.measurements = {};
    },

    clear(service) {
        delete this.measurements[service];
    }
    };

    global.Timing = Timing;
})(typeof window !== 'undefined' ? window : globalThis);
