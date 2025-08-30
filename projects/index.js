/**
 * Enhanced project page JavaScript with improved caching, error handling, and performance
 */

class GitHubDataManager {
    constructor() {
        this.debug = true; // Set to false in production
        this.cache = {
            COMMIT_CACHE_DURATION: 3600000, // 1 hour
            USER_CACHE_DURATION: 28800000,  // 8 hours
        };
        this.repositories = [
            { name: 'bookends', selector: '.last-commit.bookends', cacheKey: 'lastCommitBookends' },
            { name: 'pyscan', selector: '.last-commit.pyscan', cacheKey: 'lastCommitPyscan' },
            { name: 'weheartpy', selector: '.last-commit.whp', cacheKey: 'lastCommitWhp' }
        ];
        
        this.log('GitHubDataManager initialized');
    }

    /**
     * Enhanced logging utility
     */
    log(message, level = 'info', data = null) {
        if (!this.debug && level === 'debug') return;
        
        const timestamp = new Date().toISOString();
        const prefix = `[${timestamp}] [GitHub Data Manager]`;
        
        switch (level) {
            case 'error':
                console.error(`${prefix} ERROR:`, message, data || '');
                break;
            case 'warn':
                console.warn(`${prefix} WARN:`, message, data || '');
                break;
            case 'debug':
                console.debug(`${prefix} DEBUG:`, message, data || '');
                break;
            default:
                console.log(`${prefix} INFO:`, message, data || '');
        }
    }

    /**
     * Enhanced cache utility with validation
     */
    getCachedData(key) {
        try {
            const cachedData = localStorage.getItem(key);
            if (!cachedData) {
                this.log(`No cached data found for key: ${key}`, 'debug');
                return null;
            }
            
            const parsed = JSON.parse(cachedData);
            if (!parsed.fetchedAt) {
                this.log(`Invalid cached data structure for key: ${key}`, 'warn');
                localStorage.removeItem(key);
                return null;
            }
            
            this.log(`Found cached data for key: ${key}`, 'debug', { fetchedAt: new Date(parsed.fetchedAt) });
            return parsed;
        } catch (error) {
            this.log(`Error reading cached data for key: ${key}`, 'error', error.message);
            localStorage.removeItem(key);
            return null;
        }
    }

    /**
     * Set cached data with validation
     */
    setCachedData(key, data) {
        try {
            const dataWithTimestamp = {
                ...data,
                fetchedAt: Date.now()
            };
            localStorage.setItem(key, JSON.stringify(dataWithTimestamp));
            this.log(`Data cached successfully for key: ${key}`, 'debug');
            return true;
        } catch (error) {
            this.log(`Error caching data for key: ${key}`, 'error', error.message);
            return false;
        }
    }

    /**
     * Check if cached data is still valid
     */
    isCacheValid(cachedData, maxAge) {
        if (!cachedData || !cachedData.fetchedAt) return false;
        
        const fetchedAt = new Date(cachedData.fetchedAt);
        const cutoffTime = new Date(Date.now() - maxAge);
        const isValid = fetchedAt > cutoffTime;
        
        this.log(`Cache validity check`, 'debug', {
            fetchedAt: fetchedAt.toISOString(),
            cutoffTime: cutoffTime.toISOString(),
            isValid
        });
        
        return isValid;
    }

    /**
     * Format date consistently
     */
    formatCommitDate(dateString) {
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (error) {
            this.log(`Error formatting date: ${dateString}`, 'error', error.message);
            return 'Unknown date';
        }
    }

    /**
     * Update DOM element with commit information
     */
    updateCommitDisplay(selector, date) {
        const element = document.querySelector(selector);
        if (!element) {
            this.log(`Element not found for selector: ${selector}`, 'warn');
            return false;
        }

        const formattedDate = this.formatCommitDate(date);
        element.textContent = `Last commit: ${formattedDate}`;
        this.log(`Updated commit display for selector: ${selector}`, 'debug', { date: formattedDate });
        return true;
    }

    /**
     * Fetch commit data from GitHub API with retry logic
     */
    async fetchCommitData(repoName, retries = 2) {
        const url = `https://api.github.com/repos/ohaswin/${repoName}/commits?per_page=1`;
        
        for (let attempt = 1; attempt <= retries + 1; attempt++) {
            try {
                this.log(`Fetching commit data for ${repoName} (attempt ${attempt})`, 'debug');
                
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
                
                const response = await fetch(url, {
                    signal: controller.signal,
                    headers: {
                        'Accept': 'application/vnd.github.v3+json'
                    }
                });
                
                clearTimeout(timeoutId);
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                const data = await response.json();
                
                if (!data || data.length === 0) {
                    throw new Error('No commit data received');
                }
                
                if (!data[0]?.commit?.author?.date) {
                    throw new Error('Invalid commit data structure');
                }
                
                this.log(`Successfully fetched commit data for ${repoName}`, 'info');
                return data[0].commit.author.date;
                
            } catch (error) {
                this.log(`Attempt ${attempt} failed for ${repoName}`, 'warn', error.message);
                
                if (attempt === retries + 1) {
                    throw error;
                }
                
                // Exponential backoff
                await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
            }
        }
    }

    /**
     * Process commit data for a repository
     */
    async processRepository(repo) {
        const { name, selector, cacheKey } = repo;
        
        try {
            // Check cache first
            const cachedData = this.getCachedData(cacheKey);
            if (cachedData && this.isCacheValid(cachedData, this.cache.COMMIT_CACHE_DURATION)) {
                this.log(`Using cached commit data for ${name}`, 'info');
                this.updateCommitDisplay(selector, cachedData.date);
                return;
            }

            // Fetch fresh data
            this.log(`Cache miss or expired for ${name}, fetching fresh data`, 'info');
            const commitDate = await this.fetchCommitData(name);
            
            // Cache and display
            this.setCachedData(cacheKey, { date: commitDate });
            this.updateCommitDisplay(selector, commitDate);
            
        } catch (error) {
            this.log(`Failed to process repository ${name}`, 'error', error.message);
            
            // Try to use expired cache as fallback
            const cachedData = this.getCachedData(cacheKey);
            if (cachedData && cachedData.date) {
                this.log(`Using expired cache as fallback for ${name}`, 'warn');
                this.updateCommitDisplay(selector, cachedData.date);
            } else {
                // Show error message
                const element = document.querySelector(selector);
                if (element) {
                    element.textContent = 'Last commit: Unable to load';
                }
            }
        }
    }

    /**
     * Process all repositories concurrently
     */
    async processAllRepositories() {
        this.log('Starting to process all repositories', 'info');
        const startTime = performance.now();
        
        try {
            // Process all repositories concurrently for better performance
            await Promise.allSettled(
                this.repositories.map(repo => this.processRepository(repo))
            );
            
            const endTime = performance.now();
            this.log(`All repositories processed in ${(endTime - startTime).toFixed(2)}ms`, 'info');
            
        } catch (error) {
            this.log('Error processing repositories', 'error', error.message);
        }
    }

    /**
     * Fetch and display GitHub user data
     */
    async fetchUserData() {
        try {
            // Check cache first
            const cachedData = this.getCachedData('githubUserData');
            if (cachedData && this.isCacheValid(cachedData, this.cache.USER_CACHE_DURATION)) {
                this.log('Using cached user data', 'info');
                this.updateRepoCount(cachedData.public_repos);
                return;
            }

            // Fetch fresh data
            this.log('Fetching fresh user data from GitHub API', 'info');
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);
            
            const response = await fetch('https://api.github.com/users/ohaswin', {
                signal: controller.signal,
                headers: {
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (typeof data.public_repos !== 'number') {
                throw new Error('Invalid user data structure');
            }
            
            // Cache and display
            this.setCachedData('githubUserData', data);
            this.updateRepoCount(data.public_repos);
            this.log('Successfully fetched and cached user data', 'info');
            
        } catch (error) {
            this.log('Error fetching user data', 'error', error.message);
            
            // Try expired cache as fallback
            const cachedData = this.getCachedData('githubUserData');
            if (cachedData && typeof cachedData.public_repos === 'number') {
                this.log('Using expired cache as fallback for user data', 'warn');
                this.updateRepoCount(cachedData.public_repos);
            } else {
                this.updateRepoCount('?');
            }
        }
    }

    /**
     * Update repository count display
     */
    updateRepoCount(count) {
        const element = document.getElementById('repos');
        if (element) {
            element.textContent = count;
            this.log(`Updated repository count: ${count}`, 'debug');
        } else {
            this.log('Repository count element not found', 'warn');
        }
    }

    /**
     * Initialize the application
     */
    async init() {
        this.log('Initializing GitHub Data Manager', 'info');
        const startTime = performance.now();
        
        try {
            // Process user data and repositories concurrently
            await Promise.allSettled([
                this.fetchUserData(),
                this.processAllRepositories()
            ]);
            
            const endTime = performance.now();
            this.log(`Initialization complete in ${(endTime - startTime).toFixed(2)}ms`, 'info');
            
        } catch (error) {
            this.log('Error during initialization', 'error', error.message);
        }
    }
}

// Initialize when DOM is loaded
window.addEventListener('DOMContentLoaded', () => {
    const manager = new GitHubDataManager();
    manager.init();
});

// Make getCachedData available globally for compatibility
window.getCachedData = function(key) {
    try {
        const cachedData = localStorage.getItem(key);
        return cachedData ? JSON.parse(cachedData) : null;
    } catch {
        return null;
    }
};