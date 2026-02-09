(function (global) {
    if (global.CheckAPI) {
        return;
    }

    const CheckAPI = {
    services: {
        'self': null,
        'github-pages': 'https://github.com',
        'github-status': 'https://www.githubstatus.com',
        'cloudflare': 'https://www.cloudflare.com',
        'aws': 'https://status.aws.amazon.com',
        'discord': 'https://discord.com',
        'google': 'https://www.google.com',
        'microsoft': 'https://www.microsoft.com',
        'azure': 'https://status.azure.com',
        'hackclub': 'https://hackclub.com',
        'slack': 'https://slack.com',
        'steam': 'https://store.steampowered.com',
        'epic-games': 'https://epicgames.com',
        'fortnite': 'https://fortnite.com',
        'minecraft': 'https://www.minecraft.net',
        'twitch': 'https://www.twitch.tv',
        'youtube': 'https://www.youtube.com',
        'flavortown': 'https://flavortown.hackclub.com',
        'scraps': 'https://scraps.hackclub.com',
        'blueprint': 'https://blueprint.hackclub.com',
        'gmail': 'https://mail.google.com',
        'hcb': 'https://hcb.hackclub.com',
        'whatsapp': 'https://www.whatsapp.com',
        'reddit': 'https://www.reddit.com',
        'spotify': 'https://www.spotify.com',
        'playstation-network': 'https://www.playstation.com',
        'xbox': 'https://www.xbox.com',
        'nasa': 'https://www.nasa.gov',
        'oracle': 'https://www.oracle.com',
        'example': 'https://www.example.com',
        'google-play': 'https://play.google.com',
        'chrome-web-store': 'https://chromewebstore.google.com',
        'mozilla': 'https://www.mozilla.org',
        'firefox-addons': 'https://addons.mozilla.org',
        'openai': 'https://openai.com',
        'anthropic': 'https://claude.ai',
        'google-gemini': 'https://gemini.google.com',
        'github-copilot': 'https://github.com/features/copilot',
        'microsoft-copilot': 'https://copilot.microsoft.com',
        'midjourney': 'https://www.midjourney.com',
        'perplexity': 'https://www.perplexity.ai',
        'huggingface': 'https://huggingface.co'
    },

    history: {},

    degradedThresholdMs: 1000,

    init() {
        this.loadHistory();
        this.normalizeHistory();
        this.services.self = this.getProjectRoot();
    },

    getProjectRoot() {
        if (typeof window === 'undefined' || !window.location) {
            return null;
        }

        const parts = window.location.pathname.split('/').filter(Boolean);
        if (parts.length === 0) {
            return window.location.origin + '/';
        }

        const first = parts[0];
        const isFile = first.includes('.') || first === 'index.html';
        const isApiPath = first === 'api' || first === 'core' || first === 'ui';

        if (isFile || isApiPath) {
            return window.location.origin + '/';
        }

        const rootPath = '/' + first + '/';
        return window.location.origin + rootPath;
    },

    async checkService(service) {
        const url = this.services[service];
        if (!url) {
            return {
                service,
                status: 'unknown',
                error: 'Service not found'
            };
        }

        const startTime = performance.now();
        
        try {
            await Promise.race([
                fetch(url, { 
                    method: 'GET',
                    mode: 'no-cors',
                    cache: 'no-store',
                    credentials: 'omit'
                }),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Timeout')), 5000)
                )
            ]);

            const responseTime = Math.round(performance.now() - startTime);
            const status = responseTime >= this.degradedThresholdMs ? 'degraded' : 'online';
            
            this.recordCheck(service, true, responseTime);

            return {
                service,
                status,
                responseTime,
                timestamp: new Date().toISOString()
            };
            
        } catch (error) {
            const responseTime = Math.round(performance.now() - startTime);
            
            const isTimeout = error.message === 'Timeout' || responseTime >= 5000;
            const isNetworkError = error instanceof TypeError;
            
            if (isTimeout || isNetworkError) {
                this.recordCheck(service, false, responseTime);
                return {
                    service,
                    status: 'offline',
                    responseTime,
                    error: error.message,
                    timestamp: new Date().toISOString()
                };
            }
            
            this.recordCheck(service, true, responseTime);
            return {
                service,
                status: responseTime >= this.degradedThresholdMs ? 'degraded' : 'online',
                responseTime,
                timestamp: new Date().toISOString()
            };
        }
    },

    async checkAll() {
        const results = {};
        
        for (const service of Object.keys(this.services)) {
            results[service] = await this.checkService(service);
        }
        
        return results;
    },

    recordCheck(service, success, responseTime) {
        if (!this.history[service]) {
            this.history[service] = {
                checks: [],
                uptime: 100,
                downtime: 0
            };
        }

        this.history[service].checks.push({
            success,
            responseTime,
            timestamp: Date.now()
        });

        if (this.history[service].checks.length > 100) {
            this.history[service].checks.shift();
        }

        this.updateUptime(service);
        this.saveHistory();
    },

    updateUptime(service) {
        const data = this.history[service];
        if (!data || data.checks.length === 0) return;

        const successful = data.checks.filter(c => c.success).length;
        const uptime = (successful / data.checks.length) * 100;
        data.uptime = Math.max(0, Math.min(100, parseFloat(uptime.toFixed(2))));
        data.downtime = parseFloat((100 - data.uptime).toFixed(2));
    },

    getUptime(service) {
        return this.history[service]?.uptime || 100;
    },

    saveHistory() {
        try {
            localStorage.setItem('uptime-history', JSON.stringify(this.history));
        } catch (error) {
            console.warn('Could not save history to localStorage:', error);
        }
    },

    loadHistory() {
        try {
            const saved = localStorage.getItem('uptime-history');
            if (saved) {
                this.history = JSON.parse(saved);
            }
        } catch (error) {
            console.warn('Could not load history from localStorage:', error);
        }
    },

    normalizeHistory() {
        Object.keys(this.history).forEach((service) => {
            const data = this.history[service];
            if (!data || !Array.isArray(data.checks)) {
                this.history[service] = { checks: [], uptime: 100, downtime: 0 };
                return;
            }

            this.updateUptime(service);
        });
    },

    getHistory(service) {
        return this.history[service] || { checks: [], uptime: 100, downtime: 0 };
    },

    clearHistory() {
        this.history = {};
        this.saveHistory();
    }
    };

    global.CheckAPI = CheckAPI;
    CheckAPI.init();
})(typeof window !== 'undefined' ? window : globalThis);
