const Themes = {
    themes: ['light', 'dark', 'cloudflare'],
    currentTheme: 'light',

    init() {
        const savedTheme = this.getCookie('uptime_theme');
        if (savedTheme && this.themes.includes(savedTheme)) {
            this.setTheme(savedTheme);
        } else {
            this.setTheme('light');
        }
    },

    setTheme(theme) {
        if (!this.themes.includes(theme)) {
            console.warn(`Unknown theme: ${theme}`);
            return;
        }

        this.themes.forEach(t => {
            document.body.classList.remove(`theme-${t}`);
        });

        if (theme !== 'light') {
            document.body.classList.add(`theme-${theme}`);
        }

        this.currentTheme = theme;
        this.setCookie('uptime_theme', theme, 365);
        this.updateThemeSwitcher();
    },

    getTheme() {
        return this.currentTheme;
    },

    updateThemeSwitcher() {
        const switcherBtn = document.getElementById('themeSwitcherBtn');
        if (switcherBtn) {
            const displayNames = {
                light: '☀️ Light',
                dark: '🌙 Dark',
                cloudflare: '☁️ Cloudflare'
            };
            switcherBtn.textContent = displayNames[this.currentTheme] || this.currentTheme;
        }

        const menuItems = document.querySelectorAll('.theme-menu-item');
        menuItems.forEach(item => {
            if (item.dataset.theme === this.currentTheme) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    },

    toggleThemeMenu() {
        const themeSwitcher = document.getElementById('themeSwitcher');
        if (themeSwitcher) {
            themeSwitcher.classList.toggle('active');
        }
    },

    closeThemeMenu() {
        const themeSwitcher = document.getElementById('themeSwitcher');
        if (themeSwitcher) {
            themeSwitcher.classList.remove('active');
        }
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
    }
};

if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => Themes.init());
    } else {
        Themes.init();
    }
}
