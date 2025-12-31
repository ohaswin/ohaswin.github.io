// glassmorphic-navbar.js
class GlassmorphicNavbar extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.sidebarOpen = false;
        this.blogs = [];
    }

    static get observedAttributes() {
        return ['bg-url', 'logo', 'site-name', 'blogs-json', 'bg-pos-x', 'bg-pos-y'];
    }

    async connectedCallback() {
        await this.loadBlogs();
        this.render();
        this.attachEventListeners();
        this.loadThemePreference();
    }

    async loadBlogs() {
        const blogsJson = this.getAttribute('blogs-json') || '/blogs.json';
        try {
            const response = await fetch(blogsJson);
            const data = await response.json();
            // Support both array format and object with "posts" key
            this.blogs = Array.isArray(data) ? data : (data.posts || []);
            // Sort by date descending (latest first)
            this.blogs.sort((a, b) => new Date(b.date) - new Date(a.date));
        } catch (error) {
            console.warn('Failed to load blogs:', error);
            this.blogs = [];
        }
    }

    loadThemePreference() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        this.setAttribute('data-theme', savedTheme);
        this.updateThemeToggle(savedTheme);

        // Watch for theme changes on document
        this.themeObserver = new MutationObserver(() => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            if (currentTheme) {
                this.setAttribute('data-theme', currentTheme);
                this.updateThemeToggle(currentTheme);
            }
        });

        this.themeObserver.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['data-theme']
        });
    }

    updateThemeToggle(theme) {
        const toggles = this.shadowRoot.querySelectorAll('.theme-toggle');
        toggles.forEach(toggle => {
            toggle.textContent = theme === 'dark' ? '☀️' : '🌙';
            toggle.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
        });
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        this.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        this.updateThemeToggle(newTheme);

        this.dispatchEvent(new CustomEvent('theme-changed', {
            detail: { theme: newTheme },
            bubbles: true,
            composed: true
        }));
    }

    toggleSidebar() {
        this.sidebarOpen = !this.sidebarOpen;
        const sidebar = this.shadowRoot.querySelector('.sidebar');
        const overlay = this.shadowRoot.querySelector('.sidebar-overlay');
        const hamburger = this.shadowRoot.querySelector('.hamburger');

        if (this.sidebarOpen) {
            sidebar.classList.add('open');
            overlay.classList.add('visible');
            hamburger.classList.add('active');
            document.body.style.overflow = 'hidden';
        } else {
            sidebar.classList.remove('open');
            overlay.classList.remove('visible');
            hamburger.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    attachEventListeners() {
        const hamburger = this.shadowRoot.querySelector('.hamburger');
        const overlay = this.shadowRoot.querySelector('.sidebar-overlay');
        const themeToggles = this.shadowRoot.querySelectorAll('.theme-toggle');
        const closeSidebar = this.shadowRoot.querySelector('.close-sidebar');

        hamburger?.addEventListener('click', () => this.toggleSidebar());
        overlay?.addEventListener('click', () => this.toggleSidebar());
        closeSidebar?.addEventListener('click', () => this.toggleSidebar());
        themeToggles.forEach(toggle => {
            toggle.addEventListener('click', () => this.toggleTheme());
        });

        // Close sidebar on ESC key
        this.escHandler = (e) => {
            if (e.key === 'Escape' && this.sidebarOpen) {
                this.toggleSidebar();
            }
        };
        document.addEventListener('keydown', this.escHandler);
    }

    disconnectedCallback() {
        // Cleanup event listeners
        if (this.escHandler) {
            document.removeEventListener('keydown', this.escHandler);
        }
        if (this.themeObserver) {
            this.themeObserver.disconnect();
        }
    }

    formatDate(dateString) {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch {
            return dateString;
        }
    }

    render() {
        const bgUrl = this.getAttribute('bg-url') || 'https://images.unsplash.com/photo-1557683316-973673baf926';
        const logo = this.getAttribute('logo') || '';
        const siteName = this.getAttribute('site-name') || 'My Site';
        // New: get bg-pos-x and bg-pos-y, default to 50%
        const bgPosX = this.getAttribute('bg-pos-x') || '50';
        const bgPosY = this.getAttribute('bg-pos-y') || '50';

        this.shadowRoot.innerHTML = `
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        :host {
          display: block;
          position: relative;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
        }

        /* Main navbar */
        nav {
          position: relative;
          top: 0;
          left: 0;
          right: 0;
          height: 70px;
          background-image: url('${bgUrl}');
          background-size: cover;
          background-position: ${bgPosX}% ${bgPosY}%;
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
          border-bottom: 1px solid rgba(255, 255, 255, 0.2);
          z-index: 99;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 2rem;
          box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
          transition: background-size 0.5s ease, background-position 0.5s ease;
          width: 100%;
          max-width: 100%;
          margin: 0;
        }

        @media (min-width: 601px) {
          nav {
            max-width: var(--max-width, 1200px);
            margin-left: auto;
            margin-right: auto;
          }
        }

        nav:hover {
          background-size: 110%;
          background-position: center bottom;
        }

        .nav-brand {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          color: #fff;
          text-decoration: none;
          font-size: 1.25rem;
          font-weight: 600;
          transition: opacity 0.2s;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }

        .nav-brand:hover {
          opacity: 0.8;
        }

        .logo {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          object-fit: cover;
        }

        .nav-links {
          display: flex;
          gap: 1.5rem;
          list-style: none;
          align-items: center;
        }

        .nav-links a {
          color: #fff;
          background: rgba(255, 255, 255, 0.15);
          border: 1px solid rgba(255, 255, 255, 0.25);
          border-radius: 8px;
          text-decoration: none;
          font-size: 0.95rem;
          font-weight: 500;
          transition: all 0.2s ease;
          position: relative;
          padding: 0.5rem 1rem;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
        }

        .nav-links a:hover {
          background: rgba(255, 255, 255, 0.25);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        /* Right side controls */
        .nav-controls {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .theme-toggle {
          background: rgba(255, 255, 255, 0.15);
          border: 1px solid rgba(255, 255, 255, 0.25);
          border-radius: 50%;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 1.2rem;
          transition: all 0.2s;
        }

        .theme-toggle:hover {
          background: rgba(255, 255, 255, 0.25);
          transform: scale(1.1);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .hamburger {
          display: none;
          flex-direction: column;
          gap: 5px;
          cursor: pointer;
          padding: 8px;
          background: rgba(255, 255, 255, 0.15);
          border: 1px solid rgba(255, 255, 255, 0.25);
          border-radius: 8px;
          transition: all 0.2s;
        }

        .hamburger:hover {
          background: rgba(255, 255, 255, 0.25);
          transform: scale(1.05);
        }

        .hamburger span {
          display: block;
          width: 24px;
          height: 3px;
          background: #fff;
          border-radius: 2px;
          transition: all 0.3s;
        }

        .hamburger.active span:nth-child(1) {
          transform: rotate(45deg) translate(7px, 7px);
        }

        .hamburger.active span:nth-child(2) {
          opacity: 0;
        }

        .hamburger.active span:nth-child(3) {
          transform: rotate(-45deg) translate(7px, -7px);
        }

        /* Sidebar */
        .sidebar-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          opacity: 0;
          visibility: hidden;
          transition: all 0.3s ease;
          z-index: 100;
        }

        .sidebar-overlay.visible {
          opacity: 1;
          visibility: visible;
        }

        .sidebar {
          position: fixed;
          top: 0;
          right: -100%;
          width: min(400px, 85vw);
          background-image: url('${bgUrl}');
          background-size: cover;
          border-radius: 1px 0 0 28px;
          box-shadow: -4px 0 30px rgba(0, 0, 0, 0.2);
          transition: right 0.3s ease;
          z-index: 101;
          overflow-y: auto;
        }

        .sidebar.open {
          right: 0;
        }

        .sidebar-header {
        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
          display: flex;
          justify-content: space-around;
          align-items: center;
          padding: 1.5rem;
          border-bottom: 1px solid rgba(0, 0, 0, 0.1);
          background: rgba(0, 0, 0, 0.02);
        }

        .sidebar-title {
        text-decoration: none;
          color: #333;
        }

        .sidebar-title a {
          padding: 0.35rem;
          border-radius: 28px;
          color: #b5a2a2;
          text-decoration: none;
          font-weight: 600;
        }

        :host([data-theme="dark"]) .sidebar-title a {
         color: #e0e0e0;
        }

        .close-sidebar {
          background: rgba(0, 0, 0, 0.05);
          border: none;
          border-radius: 50%;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 1.5rem;
          color: #333;
          transition: all 0.2s;
          line-height: 1;
        }

        .close-sidebar:hover {
          background: rgba(0, 0, 0, 0.1);
          transform: rotate(90deg);
        }

        .sidebar-section {
          padding: 1.5rem;
          border-bottom: 1px solid rgba(0, 0, 0, 0.05);
        }

        .section-title {
          font-size: 0.85rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #666;
          margin-bottom: 1rem;
        }

        .blog-list-container {
          max-height: 320px;
          overflow-y: auto;
          background: rgba(255,255,255,0.08);
          border-radius: 10px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.03);
          padding: 0.5rem 0;
        }

        /* Optional: scrollbar styling */
        .blog-list-container::-webkit-scrollbar {
          width: 8px;
        }
        .blog-list-container::-webkit-scrollbar-thumb {
          background: rgba(0,0,0,0.08);
          border-radius: 4px;
        }
        :host([data-theme="dark"]) .blog-list-container {
          background: rgba(0,0,0,0.13);
        }

        .blog-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .blog-item {
          display: block;
          padding: 1rem;
         background: rgb(215 255 252 / 39%);
         backdrop-filter: blur(8px) brightness(0.0.99);
          border-radius: 12px;
          text-decoration: none;
          color: #333;
          transition: all 0.2s;
          border: 1px solid rgba(0, 0, 0, 0.05);
        }

        .blog-item:hover {
          background: rgba(0, 0, 0, 0.05);
          transform: translateX(4px);
          border-color: rgba(0, 0, 0, 0.1);
        }

        .blog-title {
          font-weight: 600;
          font-size: 0.95rem;
          margin-bottom: 0.25rem;
        }

        .blog-date {
          font-size: 0.8rem;
          color: #666;
        }

        .theme-section {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .theme-label {
          color: #b5a2a2;
          font-weight: 500;
        }

        .no-posts {
          color: #666;
          font-size: 0.9rem;
          text-align: center;
          padding: 1rem;
          font-style: italic;
        }

        :host([data-theme="dark"]) nav {
          border-bottom-color: rgba(255, 255, 255, 0.1);
        }

        :host([data-theme="dark"]) .nav-brand {
          color: #e0e0e0;
        }

        :host([data-theme="dark"]) .nav-links a {
          color: #e0e0e0;
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.2);
        }

        :host([data-theme="dark"]) .nav-links a:hover {
          background: rgba(255, 255, 255, 0.2);
        }

          
        :host([data-theme="dark"]) .theme-toggle,
        :host([data-theme="dark"]) .hamburger {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.2);
        }

        :host([data-theme="dark"]) .theme-toggle:hover,
        :host([data-theme="dark"]) .hamburger:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        :host([data-theme="dark"]) .hamburger span {
          background: #e0e0e0;
        }

        :host([data-theme="dark"]) .sidebar {
          backdrop-filter: brightness(0.3);
        }

        :host([data-theme="dark"]) .sidebar-header {
          backdrop-filter: brightness(0.3);
          background: rgba(255, 255, 255, 0.05);
          border-bottom-color: rgba(255, 255, 255, 0.1);
        }

        :host([data-theme="dark"]) .sidebar-title,
        :host([data-theme="dark"]) .theme-label {
          color: #e0e0e0;
        }

        :host([data-theme="dark"]) .close-sidebar {
          background: rgba(255, 255, 255, 0.1);
          color: #e0e0e0;
        }

        :host([data-theme="dark"]) .close-sidebar:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        :host([data-theme="dark"]) .section-title {
          color: #999;
        }

        :host([data-theme="dark"]) .blog-item {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(255, 255, 255, 0.1);
          color: #e0e0e0;
        }

        :host([data-theme="dark"]) .blog-item:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.15);
        }

        :host([data-theme="dark"]) .blog-date,
        :host([data-theme="dark"]) .no-posts {
          color: #999;
        }

        :host([data-theme="dark"]) .sidebar-section {
          backdrop-filter: brightness(0.3);
          border-bottom-color: rgba(255, 255, 255, 0.05);
        }

        /* Mobile responsive */
        @media (max-width: 768px) {
          nav {
            padding: 0 1rem;
          }

          .nav-links {
            display: none;
          }

          .hamburger {
            display: flex;
          }

          .nav-brand {
            font-size: 1.1rem;
          }

          .logo {
            width: 36px;
            height: 36px;
          }
        }

        /* Smooth scrolling offset for fixed navbar */
        :host {
          scroll-margin-top: 70px;
        }

        /* Prevent sidebar from showing on initial load */
        .sidebar:not(.open) {
          display: none;
        }

        .sidebar.open {
          display: block;
        }
      </style>
      
      <nav>
        <a href="/" class="nav-brand">
          ${logo ? `<img src="${logo}" alt="${siteName}" class="logo">` : ''}
          <span>${siteName}</span>
        </a>

        <ul class="nav-links">
          <li><a href="/">Home</a></li>
          <li><a href="/blog">Blog</a></li>
          <li><a href="/projects">Projects</a></li>
          <li><a href="/about">About</a></li>
          <li><a href="/contact">Contact</a></li>
        </ul>

        <div class="nav-controls">
          <button class="theme-toggle" aria-label="Toggle theme">🌙</button>
          <div class="hamburger">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </nav>

      <div class="sidebar-overlay"></div>
      
      <div class="sidebar">
        <div class="sidebar-header">
          <span class="sidebar-title">
          <a href="/blog">Blog</a>
          <a href="/projects">Projects</a>
          <a href="/about">About</a>
          <a href="/contact">Contact</a>
          </span>
          <button class="close-sidebar" aria-label="Close menu">×</button>
        </div>

        <div class="sidebar-section">
          <div class="section-title">Recent Posts</div>
          <div class="blog-list-container">
            <div class="blog-list">
              ${this.blogs.length ? this.blogs.map(blog => `
                <a href="${blog.url}" class="blog-item">
                  <div class="blog-title">${blog.title}</div>
                  <div class="blog-date">${this.formatDate(blog.date)}</div>
                </a>
              `).join('') : '<div class="no-posts">No recent posts</div>'}
            </div>
          </div>
        </div>

        <div class="sidebar-section theme-section">
          <span class="theme-label">Dark Mode</span>
          <button class="theme-toggle" aria-label="Toggle theme">🌙</button>
        </div>
      </div>
    `;
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue && this.shadowRoot.innerHTML) {
            this.render();
            this.attachEventListeners();
        }
    }
}

customElements.define('glassmorphic-navbar', GlassmorphicNavbar);