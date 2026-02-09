(function (global) {
    if (global.SelfAPI) {
        return;
    }

    const SelfAPI = {
    checkInterval: 60000,
    lastCheck: null,
    checks: {
        successful: 0,
        failed: 0,
        total: 0
    },

    init() {
        this.loadData();
        this.normalizeCounts();
    },

    async check() {
        const startTime = performance.now();
        const checkId = Date.now();
        const checkUrl = window.location.href.split('?')[0] + '?check=' + checkId;
        
        try {
            const response = await Promise.race([
                fetch(checkUrl, { 
                    method: 'HEAD',
                    cache: 'no-store'
                }),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Timeout')), 5000)
                )
            ]);


            const timing = this.getResourceTiming(checkUrl);
            const responseTime = timing ? timing.duration : Math.round(performance.now() - startTime);
            
            this.checks.successful++;
            this.lastCheck = {
                status: 'online',
                responseTime,
                timestamp: new Date().toISOString(),
                success: true
            };
            
            if (timing && timing.breakdown) {
                this.lastCheck.timing = timing.breakdown;
            }
            
            this.saveData();
            return true;
        } catch (error) {
            this.checks.failed++;
            this.lastCheck = {
                status: 'offline',
                error: error.message,
                timestamp: new Date().toISOString(),
                success: false
            };
            
            this.saveData();
            return false;
        } finally {
            this.checks.total++;
        }
    },

    getResourceTiming(url) {
        try {
            const entries = performance.getEntriesByType('resource');
            const entry = entries.reverse().find(e => e.name.startsWith(url.split('?')[0]));
            
            if (!entry) {
                return null;
            }

            const duration = Math.round(entry.duration);
            const breakdown = {
                dns: Math.round(entry.domainLookupEnd - entry.domainLookupStart),
                tcp: Math.round(entry.connectEnd - entry.connectStart),
                ssl: entry.secureConnectionStart > 0 ? Math.round(entry.connectEnd - entry.secureConnectionStart) : 0,
                ttfb: Math.round(entry.responseStart - entry.requestStart),
                download: Math.round(entry.responseEnd - entry.responseStart),
                total: duration
            };

            return {
                duration,
                breakdown
            };
        } catch (error) {
            return null;
        }
    },

    startChecking() {
        this.check();
        this.intervalId = setInterval(() => this.check(), this.checkInterval);
    },

    stopChecking() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
    },

    getUptime() {
        if (this.checks.total === 0) return 100;
        const uptime = (this.checks.successful / this.checks.total) * 100;
        return Math.max(0, Math.min(100, parseFloat(uptime.toFixed(2))));
    },

    getDowntime() {
        if (this.checks.total === 0) return 0;
        return parseFloat((100 - this.getUptime()).toFixed(2));
    },

    async checkAndGetStatus() {
        await this.check();
        return this.getStatus();
    },

    getStatus() {
        return {
            service: 'self',
            name: 'Self Uptime Monitor',
            status: this.lastCheck?.status || 'unknown',
            uptime: this.getUptime(),
            downtime: this.getDowntime(),
            checks: this.checks,
            lastCheck: this.lastCheck,
            responseTime: this.lastCheck?.responseTime || null
        };
    },

    saveData() {
        try {
            localStorage.setItem('self-api-data', JSON.stringify({
                checks: this.checks,
                lastCheck: this.lastCheck
            }));
        } catch (error) {
            console.warn('Could not save SelfAPI data:', error);
        }
    },

    loadData() {
        try {
            const saved = localStorage.getItem('self-api-data');
            if (saved) {
                const data = JSON.parse(saved);
                this.checks = data.checks || this.checks;
                this.lastCheck = data.lastCheck || null;
            }
        } catch (error) {
            console.warn('Could not load SelfAPI data:', error);
        }
        this.normalizeCounts();
    },

    normalizeCounts() {
        const successful = Number(this.checks.successful) || 0;
        const failed = Number(this.checks.failed) || 0;
        const total = successful + failed;

        this.checks.successful = successful;
        this.checks.failed = failed;
        this.checks.total = total;
    }
    };

    global.SelfAPI = SelfAPI;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => SelfAPI.init());
    } else {
        SelfAPI.init();
    }
})(typeof window !== 'undefined' ? window : globalThis);
