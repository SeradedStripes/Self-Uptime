(function (global) {
    if (global.ISPAPI) {
        return;
    }

    const ISPAPI = {
    data: {
        isp: 'Unknown',
        country: 'Unknown',
        city: 'Unknown',
        ip: 'Unknown',
        connectionType: 'Unknown',
        online: navigator.onLine,
        latency: 0
    },

    async init() {
        this.detectOnlineStatus();
        this.detectConnectionType();
    },

    detectOnlineStatus() {
        window.addEventListener('online', () => {
            this.data.online = true;
        });
        window.addEventListener('offline', () => {
            this.data.online = false;
        });
        this.data.online = navigator.onLine;
    },

    detectConnectionType() {
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        if (connection) {
            this.data.connectionType = connection.effectiveType || 'unknown';
        }
    },

    async fetchGeoIP() {
        this.data.isp = 'Browser';
        this.data.ip = 'Private';
        this.data.country = navigator.language || 'Unknown';
        this.data.city = 'Local';
    },

    async measureLatency() {
        const measurements = [];
        
        for (let i = 0; i < 3; i++) {
            try {
                const checkId = Date.now() + '-' + i;
                const checkUrl = window.location.href.split('?')[0] + '?latency-check=' + checkId;
                
                await Promise.race([
                    fetch(checkUrl, {
                        method: 'HEAD',
                        cache: 'no-store'
                    }),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
                ]);
                
                const timing = this.getResourceTiming(checkUrl);
                if (timing) {
                    measurements.push(timing.duration);
                }
            } catch (error) {
            }
            
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        if (measurements.length > 0) {
            this.data.latency = Math.round(
                measurements.reduce((a, b) => a + b) / measurements.length
            );
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

    async checkAndGetStatus() {
        await this.fetchGeoIP();
        await this.measureLatency();
        return this.getStatus();
    },

    getStatus() {
        return {
            service: 'connection',
            name: 'Your Connection',
            status: this.data.online ? 'online' : 'offline',
            isp: this.data.isp,
            country: this.data.country,
            city: this.data.city,
            ip: this.data.ip,
            connectionType: this.data.connectionType,
            latency: this.data.latency,
            online: this.data.online,
            responseTime: this.data.latency
        };
    }
    };

    global.ISPAPI = ISPAPI;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => ISPAPI.init());
    } else {
        ISPAPI.init();
    }
})(typeof window !== 'undefined' ? window : globalThis);
