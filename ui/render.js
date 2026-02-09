const Render = {
    updateInterval: 5000,
    currentCategory: null,
    services: ['self', 'github-pages', 'github-status', 'cloudflare', 'aws', 'discord', 'google', 'microsoft', 'azure', 'hackclub', 'slack', 'steam', 'epic-games', 'fortnite', 'minecraft', 'twitch', 'youtube', 'flavortown', 'scraps', 'blueprint', 'gmail', 'hcb', 'whatsapp', 'spotify', 'playstation-network', 'xbox', 'nasa', 'oracle', 'example', 'google-play', 'chrome-web-store', 'mozilla', 'firefox-addons', 'openai', 'anthropic', 'google-gemini', 'github-copilot', 'microsoft-copilot', 'midjourney', 'perplexity', 'huggingface'],
    
    categoryMap: {
        'all': "All",
        'self': 'Self',
        'cloud': 'Cloud',
        'social': 'Social',
        'gaming': 'Gaming',
        'video': 'Video',
        'github': 'GitHub',
        'network': 'Network',
        'community': 'Community',
        'useless': 'Useless',
        'ai': 'AI',
        'other': 'Other'
    },

    getCurrentCategory() {
        if (this.currentCategory) return this.currentCategory;
        
        const pathname = window.location.pathname;
        const filename = pathname.split('/').pop().replace('.html', '');
        
        if (filename.startsWith('category-')) {
            const category = filename.replace('category-', '');
            if (this.categoryMap[category] || category === 'all') {
                this.currentCategory = category;
                return category;
            }
        }
        
        this.currentCategory = 'all';
        return 'all';
    },

    init() {
        const missing = this.getMissingDependencies();
        if (missing.length > 0) {
            console.error('Missing dependencies:', missing.join(', '));
            this.renderGlobalError('Missing API scripts');
            return;
        }

        if (this._initialized) {
            return;
        }
        this._initialized = true;

        this.captureOriginalOrder();
        this.loadSortFromCookie();
        this.setupCategoryNavigation();
        this.filterCardsByCategory();

        this.setupEventListeners();
        this.startUpdating();
    },
    
    setupCategoryNavigation() {
        const currentCategory = this.getCurrentCategory();
        const categoryFilters = document.querySelectorAll('.category-filters .filter-btn');
        
        categoryFilters.forEach(btn => {
            if (btn.tagName === 'A') {
                return;
            }
            
            const btnCategory = btn.dataset.category;
            
            if (btnCategory === 'all') {
                btn.dataset.navTarget = '/';
            } else {
                btn.dataset.navTarget = `/category-${btnCategory}.html`;
            }
            btn.classList.add('category-nav');
            
            if (btnCategory === currentCategory) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    },
    
    filterCardsByCategory() {
        const currentCategory = this.getCurrentCategory();
        const cards = document.querySelectorAll('.monitor-card');
        
        if (currentCategory === 'all') {
            cards.forEach(card => card.classList.remove('hidden'));
        } else {
            cards.forEach(card => {
                if (card.dataset.category === currentCategory) {
                    card.classList.remove('hidden');
                } else {
                    card.classList.add('hidden');
                }
            });
        }
    },

    getMissingDependencies() {
        const deps = ['CheckAPI', 'SelfAPI', 'Classify', 'Timing'];
        return deps.filter((name) => typeof window[name] === 'undefined');
    },

    setupEventListeners() {
        const checkBtn = document.getElementById('checkBtn');
        const resetBtn = document.getElementById('resetBtn');
        const searchInput = document.getElementById('searchInput');
        const sortSelect = document.getElementById('sortSelect');
        const exportBtn = document.getElementById('exportBtn');
        const statusFilters = document.querySelectorAll('.status-filters .filter-btn');
        const categoryNavs = document.querySelectorAll('.category-nav');
        const themeSwitcherBtn = document.getElementById('themeSwitcherBtn');
        const themeMenuItems = document.querySelectorAll('.theme-menu-item');

        if (checkBtn) {
            checkBtn.addEventListener('click', () => this.checkAllServices());
        }

        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.reset());
        }

        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
        }

        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => this.handleSortChange(e.target.value));
        }

        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.toggleExportMenu());
        }

        const exportMenu = document.getElementById('exportMenu');
        if (exportMenu) {
            exportMenu.querySelectorAll('.dropdown-item').forEach(item => {
                item.addEventListener('click', (e) => this.handleExportAction(e.target.dataset.action));
            });
        }

        if (themeSwitcherBtn) {
            themeSwitcherBtn.addEventListener('click', () => {
                if (typeof Themes !== 'undefined') {
                    Themes.toggleThemeMenu();
                }
            });
        }

        themeMenuItems.forEach(item => {
            item.addEventListener('click', (e) => {
                const theme = e.target.dataset.theme;
                if (theme && typeof Themes !== 'undefined') {
                    Themes.setTheme(theme);
                    Themes.closeThemeMenu();
                }
            });
        });


        document.addEventListener('click', (e) => {
            const themeSwitcher = document.getElementById('themeSwitcher');
            if (themeSwitcher && !themeSwitcher.contains(e.target)) {
                if (typeof Themes !== 'undefined') {
                    Themes.closeThemeMenu();
                }
            }
        });

        categoryNavs.forEach(btn => {
            btn.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopPropagation();
                const target = btn.dataset.navTarget;
                if (!target) return;
                document.body.classList.add('page-fade-out');
                setTimeout(() => {
                    window.location.href = target;
                }, 200);
            });
        });

        statusFilters.forEach(btn => {
            btn.addEventListener('click', (e) => this.handleStatusFilter(e.target));
        });
    },

    getSortedServices() {
        const sortSelect = document.getElementById('sortSelect');
        const sortValue = sortSelect ? sortSelect.value : 'default';
        const grid = document.querySelector('.monitors-grid');
        
        if (!grid) return this.services;

        const cards = Array.from(grid.querySelectorAll('.monitor-card'));
        const sorted = cards.slice().sort((a, b) => {
            const nameA = (a.dataset.name || '').toLowerCase();
            const nameB = (b.dataset.name || '').toLowerCase();
            const responseA = parseFloat(a.dataset.responseTime || '');
            const responseB = parseFloat(b.dataset.responseTime || '');
            const uptimeA = parseFloat(a.dataset.uptime || '');
            const uptimeB = parseFloat(b.dataset.uptime || '');
            const orderA = parseInt(a.dataset.order || '0', 10);
            const orderB = parseInt(b.dataset.order || '0', 10);

            const responseAVal = Number.isFinite(responseA) ? responseA : Number.POSITIVE_INFINITY;
            const responseBVal = Number.isFinite(responseB) ? responseB : Number.POSITIVE_INFINITY;
            const uptimeAVal = Number.isFinite(uptimeA) ? uptimeA : Number.NEGATIVE_INFINITY;
            const uptimeBVal = Number.isFinite(uptimeB) ? uptimeB : Number.NEGATIVE_INFINITY;

            switch (sortValue) {
                case 'name-asc':
                    return nameA.localeCompare(nameB);
                case 'name-desc':
                    return nameB.localeCompare(nameA);
                case 'response-asc':
                    return responseAVal - responseBVal;
                case 'response-desc':
                    return responseBVal - responseAVal;
                case 'uptime-asc':
                    return uptimeAVal - uptimeBVal;
                case 'uptime-desc':
                    return uptimeBVal - uptimeAVal;
                case 'default':
                default:
                    return orderA - orderB;
            }
        });

        return sorted.map(card => card.dataset.service);
    },

    async checkAllServices() {
        const sortedServices = this.getSortedServices();
        for (const service of sortedServices) {
            await this.updateServiceCard(service);
        }
    },

    async updateServiceCard(service) {
        const card = document.querySelector(`[data-service="${service}"]`);
        if (!card) return;

        try {
            let statusData;

            if (service === 'self') {
                statusData = await SelfAPI.checkAndGetStatus();
            } else {
                statusData = await CheckAPI.checkService(service);
                
                statusData.uptime = CheckAPI.getUptime(service);
            }

            this.renderCardData(card, statusData);
            this.applySort();
        } catch (error) {
            console.error(`Error updating ${service} card:`, error);
            this.renderCardError(card, error.message);
        }
    },

    renderCardData(card, statusData) {
        if (!card) return;

        const statusDot = card.querySelector('.status-dot');
        const statusText = card.querySelector('.status-text');

        if (statusDot && statusText) {
            const classification = Classify.classifyStatus(statusData);
            const statusClass = Classify.getStatusClass(classification);
            const statusMessage = Classify.getStatusMessage(classification);
            const statusColor = Classify.getStatusColor(classification);

            statusDot.className = 'status-dot ' + statusClass;
            statusDot.style.backgroundColor = statusColor;
            statusText.textContent = statusMessage;
        }

        const uptimeValue = card.querySelector('[data-stat="uptime"]');
        const responseValue = card.querySelector('[data-stat="response"]');

        if (uptimeValue) {
            const uptimeNum = typeof statusData.uptime === 'number' ? statusData.uptime : 0;
            uptimeValue.textContent = uptimeNum > 0 ? uptimeNum.toFixed(2) + '%' : '-';
            card.dataset.uptime = uptimeNum.toFixed(2);
        }

        if (responseValue && statusData.responseTime) {
            const formattedTime = Timing.formatTime(statusData.responseTime);
            responseValue.textContent = formattedTime;
            card.dataset.responseTime = String(statusData.responseTime);
        } else if (responseValue) {
            card.dataset.responseTime = '';
        }

        card.dataset.currentStatus = statusData.status || 'unknown';

        card.classList.add('updated');
    },

    renderCardError(card, errorMessage) {
        if (!card) return;

        const statusDot = card.querySelector('.status-dot');
        const statusText = card.querySelector('.status-text');

        if (statusDot) {
            statusDot.className = 'status-dot status-critical';
            statusDot.style.backgroundColor = '#dc3545';
        }

        if (statusText) {
            statusText.textContent = 'Error: ' + errorMessage;
        }
    },

    renderGlobalError(message) {
        const cards = document.querySelectorAll('.monitor-card');
        cards.forEach(card => {
            this.renderCardError(card, message);
        });
    },

    startUpdating() {
        this.checkAllServices();
        this.intervalId = setInterval(() => this.checkAllServices(), this.updateInterval);
    },

    stopUpdating() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
    },

    reset() {
        const cards = document.querySelectorAll('.monitor-card');
        cards.forEach(card => {
            const statusDot = card.querySelector('.status-dot');
            const statusText = card.querySelector('.status-text');
            const statValues = card.querySelectorAll('.stat-value');

            if (statusDot) {
                statusDot.className = 'status-dot';
                statusDot.style.backgroundColor = '#ffc107';
            }

            if (statusText) {
                statusText.textContent = 'Checking...';
            }

            statValues.forEach(el => {
                el.textContent = '-';
            });

            card.classList.remove('updated');
        });

        CheckAPI.clearHistory();
        SelfAPI.loadData();

        this.checkAllServices();
    },

    captureOriginalOrder() {
        const cards = document.querySelectorAll('.monitor-card');
        cards.forEach((card, index) => {
            card.dataset.order = String(index);
        });
    },

    handleSortChange(value) {
        this.setCookie('uptime_sort', value, 365);
        this.applySort();
    },

    loadSortFromCookie() {
        const sortSelect = document.getElementById('sortSelect');
        if (!sortSelect) return;

        const saved = this.getCookie('uptime_sort');
        if (saved) {
            sortSelect.value = saved;
        }
    },

    applySort() {
        const sortSelect = document.getElementById('sortSelect');
        if (!sortSelect) return;

        const sortValue = sortSelect.value;
        const grid = document.querySelector('.monitors-grid');
        if (!grid) return;

        const cards = Array.from(grid.querySelectorAll('.monitor-card'));
        const sorted = cards.slice().sort((a, b) => {
            const nameA = (a.dataset.name || '').toLowerCase();
            const nameB = (b.dataset.name || '').toLowerCase();
            const responseA = parseFloat(a.dataset.responseTime || '');
            const responseB = parseFloat(b.dataset.responseTime || '');
            const uptimeA = parseFloat(a.dataset.uptime || '');
            const uptimeB = parseFloat(b.dataset.uptime || '');
            const orderA = parseInt(a.dataset.order || '0', 10);
            const orderB = parseInt(b.dataset.order || '0', 10);

            const responseAVal = Number.isFinite(responseA) ? responseA : Number.POSITIVE_INFINITY;
            const responseBVal = Number.isFinite(responseB) ? responseB : Number.POSITIVE_INFINITY;
            const uptimeAVal = Number.isFinite(uptimeA) ? uptimeA : Number.NEGATIVE_INFINITY;
            const uptimeBVal = Number.isFinite(uptimeB) ? uptimeB : Number.NEGATIVE_INFINITY;

            switch (sortValue) {
                case 'name-asc':
                    return nameA.localeCompare(nameB);
                case 'name-desc':
                    return nameB.localeCompare(nameA);
                case 'response-asc':
                    return responseAVal - responseBVal;
                case 'response-desc':
                    return responseBVal - responseAVal;
                case 'uptime-asc':
                    return uptimeAVal - uptimeBVal;
                case 'uptime-desc':
                    return uptimeBVal - uptimeAVal;
                case 'default':
                default:
                    return orderA - orderB;
            }
        });

        sorted.forEach(card => grid.appendChild(card));
    },

    setCookie(name, value, days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        const expires = 'expires=' + date.toUTCString();
        document.cookie = name + '=' + encodeURIComponent(value) + ';' + expires + ';path=/';
    },

    getCookie(name) {
        const cookieName = name + '=';
        const decoded = decodeURIComponent(document.cookie || '');
        const parts = decoded.split(';');
        for (let i = 0; i < parts.length; i++) {
            const part = parts[i].trim();
            if (part.startsWith(cookieName)) {
                return part.substring(cookieName.length, part.length);
            }
        }
        return '';
    },

    handleSearch(query) {
        const cards = document.querySelectorAll('.monitor-card');
        const searchTerm = query.toLowerCase().trim();

        cards.forEach(card => {
            const name = (card.dataset.name || '').toLowerCase();
            const service = (card.dataset.service || '').toLowerCase();
            const category = (card.dataset.category || '').toLowerCase();

            const matches = !searchTerm || 
                name.includes(searchTerm) || 
                service.includes(searchTerm) ||
                category.includes(searchTerm);
            
            if (matches) {
                card.classList.remove('hidden');
            } else {
                card.classList.add('hidden');
            }
        });

        this.applySort();
    },

    handleCategoryFilter(button) {
        const category = button.dataset.category;
        const categoryFilters = document.querySelectorAll('.category-filters .filter-btn');
        
        categoryFilters.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');

        const cards = document.querySelectorAll('.monitor-card');
        
        cards.forEach(card => {
            if (category === 'all' || card.dataset.category === category) {
                card.classList.remove('hidden');
            } else {
                card.classList.add('hidden');
            }
        });

        this.applySort();
    },

    handleStatusFilter(button) {
        const status = button.dataset.status;
        
        button.classList.toggle('active');

        const activeStatusFilters = Array.from(document.querySelectorAll('.status-filters .filter-btn.active'))
            .map(btn => btn.dataset.status);

        const cards = document.querySelectorAll('.monitor-card');

        cards.forEach(card => {
            const cardStatus = card.dataset.currentStatus;
            
            if (activeStatusFilters.length === 0) {
                card.classList.remove('hidden');
            } else {
                const statusMap = {
                    'online': 'healthy',
                    'degraded': 'degraded',
                    'offline': 'offline',
                    'critical': 'offline'
                };

                const mappedStatus = statusMap[cardStatus] || cardStatus;

                if (activeStatusFilters.includes(mappedStatus)) {
                    card.classList.remove('hidden');
                } else {
                    card.classList.add('hidden');
                }
            }
        });

        this.applySort();
    },

    toggleExportMenu() {
        const dropdown = document.querySelector('.export-dropdown');
        if (!dropdown) return;

        dropdown.classList.toggle('active');

        if (dropdown.classList.contains('active')) {
            document.addEventListener('click', (e) => {
                if (!dropdown.contains(e.target)) {
                    dropdown.classList.remove('active');
                }
            }, { once: true });
        }
    },

    handleExportAction(action) {
        const dropdown = document.querySelector('.export-dropdown');
        if (dropdown) {
            dropdown.classList.remove('active');
        }

        const json = this.generateExportJSON();

        if (action === 'copy') {
            navigator.clipboard.writeText(json).then(() => {
                alert('JSON copied to clipboard!');
            }).catch(() => {
                alert('Failed to copy to clipboard');
            });
        } else if (action === 'download') {
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `uptime-export-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
    },

    generateExportJSON() {
        const grid = document.querySelector('.monitors-grid');
        const cards = grid.querySelectorAll('.monitor-card:not(.hidden)');
        const exportData = {
            timestamp: new Date().toISOString(),
            services: []
        };

        cards.forEach(card => {
            const service = card.dataset.service;
            const name = card.dataset.name;
            const category = card.dataset.category;
            const uptime = card.dataset.uptime || '0';
            const responseTime = card.dataset.responseTime || '0';
            const status = card.dataset.currentStatus || 'unknown';
            const statusText = card.querySelector('.status-text')?.textContent || 'Unknown';

            exportData.services.push({
                service,
                name,
                category,
                status,
                statusText,
                uptime: parseFloat(uptime),
                responseTime: parseInt(responseTime)
            });
        });

        return JSON.stringify(exportData, null, 2);
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Render.init());
} else {
    Render.init();
}
