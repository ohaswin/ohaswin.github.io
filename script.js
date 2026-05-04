function deltadate(date) {
    const now = new Date();
    const diff = now - new Date(date);
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    return days > 0 ? `${days} day${days === 1 ? '' : 's'} ago` : 'today';
}

function elapsedTime(date) {
    const now = new Date();
    const diff = now - new Date(date);

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const weeks = Math.floor(days / 7);
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);

    if (years > 0) return `${years} year${years > 1 ? 's' : ''} ago`;
    if (months > 0) return `${months} month${months > 1 ? 's' : ''} ago`;
    if (weeks > 0) return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'just now';
}

async function fetchBlogPosts() {
    try {
        const response = await fetch('/blog.json');
        const blogData = await response.json();

        const recentPosts = blogData.posts
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 3);

        const blogContainer = document.querySelector('.blog ul');

        const noscriptContent = blogContainer.querySelector('noscript');
        blogContainer.innerHTML = '';
        if (noscriptContent) {
            blogContainer.appendChild(noscriptContent);
        }

        recentPosts.forEach(post => {
            const listItem = document.createElement('li');
            const postDate = new Date(post.date);
            const formattedDate = postDate.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            listItem.innerHTML = `
            <div>
                <small>${formattedDate} (${elapsedTime(post.date)})</small>
            </div>
            <a href="${post.url}">${post.title}</a>
        `;
            blogContainer.appendChild(listItem);
        });

        if (blogData.totalPosts > 0) {
            const remainingPosts = Math.max(0, blogData.totalPosts - recentPosts.length);
            const moreItem = document.createElement('li');
            moreItem.innerHTML = `
            <div>
                <small><a href="/blog">>> /blog${remainingPosts > 0 ? ` (+${remainingPosts})` : ''}</a></small>
            </div>
        `;
            blogContainer.appendChild(moreItem);
        }

    } catch (error) {
        console.error('Error fetching blog posts:', error);

        const blogContainer = document.querySelector('.blog ul');
        if (!blogContainer.querySelector('li:not(noscript li)')) {
            const fallbackItem = document.createElement('li');
            fallbackItem.innerHTML = `
            <div>
                <small><a href="/blog">>> /blog</a></small>
            </div>
        `;
            blogContainer.appendChild(fallbackItem);
        }
    }
}

const COMMIT_CACHE_KEY = 'ohaswin_latest_commit';
const COMMIT_ETAG_KEY = 'ohaswin_events_etag';

async function getMyLatestCommit() {
    // Return cached result within the same session
    try {
        const cached = sessionStorage.getItem(COMMIT_CACHE_KEY);
        if (cached) return JSON.parse(cached);
    } catch (_) { }

    try {
        // Step 1: fetch events, using ETag for conditional request
        const eventsUrl = 'https://api.github.com/users/ohaswin/events?per_page=5';
        const headers = { 'Accept': 'application/vnd.github+json' };
        try {
            const etag = sessionStorage.getItem(COMMIT_ETAG_KEY);
            if (etag) headers['If-None-Match'] = etag;
        } catch (_) { }

        const eventsRes = await fetch(eventsUrl, { headers });

        // 304 → nothing changed since last etag; fall through to null
        if (eventsRes.status === 304) return null;
        if (!eventsRes.ok) throw new Error(`Events API ${eventsRes.status}`);

        // Persist new ETag for next call
        try {
            const newEtag = eventsRes.headers.get('ETag');
            if (newEtag) sessionStorage.setItem(COMMIT_ETAG_KEY, newEtag);
        } catch (_) { }

        const events = await eventsRes.json();

        // Step 2: find the most recent PushEvent to any of ohaswin's own repos
        const pushEvent = events.find(e =>
            e.type === 'PushEvent' && e.repo.name.startsWith('ohaswin/')
        );
        if (!pushEvent) throw new Error('No recent push found');

        const repoName = pushEvent.repo.name;           // "ohaswin/repo"
        const headSha = pushEvent.payload.head;         // always present

        // Step 3: fetch the commit object for the head SHA
        const commitRes = await fetch(
            `https://api.github.com/repos/${repoName}/commits/${headSha}`,
            { headers: { 'Accept': 'application/vnd.github+json' } }
        );
        if (!commitRes.ok) throw new Error(`Commits API ${commitRes.status}`);

        const { commit, html_url } = await commitRes.json();

        const result = {
            repository: repoName.replace('ohaswin/', ''),
            hash: headSha.substring(0, 7),
            message: commit.message.split('\n')[0],  // first line only
            author: commit.author.name,
            date: deltadate(commit.author.date),
            url: html_url,
        };

        // Cache for the rest of the session
        try { sessionStorage.setItem(COMMIT_CACHE_KEY, JSON.stringify(result)); } catch (_) { }

        return result;
    } catch (error) {
        console.error('Error fetching commit:', error);
        return null;
    }
}

let toggle = true;
const isMobile = window.matchMedia("(max-width: 768px)").matches;
const TAP_HINT_STORAGE_KEY = 'ohaswinTapHintDismissed';

function positionTapHint() {
    const hint = document.querySelector('.tap-hint');
    const img = document.querySelector('.img img');
    if (!hint || !img || hint.classList.contains('is-dismissed')) return;

    const rect = img.getBoundingClientRect();
    const hintWidth = hint.offsetWidth || 72;
    const hintHeight = hint.offsetHeight || 22;
    const margin = 8;
    const x = Math.min(window.innerWidth - hintWidth - margin, rect.right - hintWidth * 0.72);
    const y = Math.min(window.innerHeight - hintHeight - margin, rect.bottom - hintHeight * 0.45);

    hint.style.left = `${Math.max(margin, x)}px`;
    hint.style.top = `${Math.max(margin, y)}px`;
}

function dismissTapHint() {
    const hint = document.querySelector('.tap-hint');
    if (!hint) return;

    hint.classList.remove('is-visible');
    hint.classList.add('is-dismissed');

    try {
        localStorage.setItem(TAP_HINT_STORAGE_KEY, '1');
    } catch (error) {
        // Ignore storage failures in private browsing or blocked storage contexts.
    }
}

function setupTapHint() {
    const hint = document.querySelector('.tap-hint');
    if (!hint) return;

    let isDismissed = false;
    try {
        isDismissed = localStorage.getItem(TAP_HINT_STORAGE_KEY) === '1';
    } catch (error) {
        isDismissed = false;
    }

    if (isDismissed) {
        hint.classList.add('is-dismissed');
        return;
    }

    positionTapHint();
    window.addEventListener('resize', positionTapHint, { passive: true });
    window.addEventListener('scroll', positionTapHint, { passive: true });

    window.setTimeout(() => {
        if (!hint.classList.contains('is-dismissed')) {
            positionTapHint();
            hint.classList.add('is-visible');
            requestAnimationFrame(positionTapHint);
        }
    }, 2800);
}

function flip() {
    dismissTapHint();

    const img = document.querySelector('.img img');
    const header = document.querySelector('.header');
    const subheader = document.querySelector('.subheader');
    const menu = document.querySelector('.menu');

    document.title = toggle ? "Aswin S" : "ohaswin, n.";
    img.src = toggle ? "/assets/outp.webp" : "/assets/me.avif";
    document.querySelector('.img').style.animation = "none";
    header.style.fontFamily = toggle ? "DM Serif Text" : "JetBrains Mono";
    subheader.style.marginRight = toggle ? "1rem" : "inherit";
    subheader.style.fontFamily = toggle ? "Lexend Deca" : "JetBrains Mono";
    subheader.style.fontSize = isMobile ? (toggle ? "0.89rem" : "small") : (toggle ? "1.5rem" : "1.1rem");
    header.style.fontSize = isMobile ? (toggle ? "1.5rem" : "inherit") : (toggle ? "3.5rem" : "3.5rem");
    header.textContent = isMobile ? (toggle ? "Aswin S, 19" : "ohaswin, n.") : (toggle ? "Aswin S" : "ohaswin, n.")
    menu.style.marginTop = toggle ? "40dvh" : "20dvh";
    subheader.innerHTML = !toggle ?
        `<br>1: Aswin, computer enthusiast.<br>2: An aspiring researcher.<br>3: Open source developer.` :
        `<br>I'm a second year CS undergrad. Former freelancer, now I study distributed systems, cellular networks, systems programming and build software I find interesting or useful.<br><br>Built: <a href="https://github.com/ohaswin/pyscan">pyscan</a> (~60k downloads)<br>Building: <a href="https://github.com/ohaswin/bookends">bookends</a> (WIP)<br><a href="https://linkedin.com/in/ohaswin">LinkedIn</a> | <a href="https://github.com/ohaswin">GitHub</a> | <a href="/resume.pdf">CV</a>`;
    toggle = !toggle;
    requestAnimationFrame(positionTapHint);
}

// Game of Life Logic
function initGameOfLife() {
    const canvas = document.getElementById('life-grid');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let resolution = window.innerWidth < 768 ? 20 : 40; // Smaller grid on mobile
    let cols, rows;
    let grid;
    let animationId;
    let isRunning = false;
    let startTimer = null;

    function resizeCanvas() {
        const newResolution = window.innerWidth < 768 ? 20 : 40;

        // If resolution changed, we should probably reset or accept the visual shift
        if (newResolution !== resolution) {
            resolution = newResolution;
            // Optional: reset grid if resolution changes to avoid weird scaling artifacts
            // grid = null; 
        }

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        cols = Math.ceil(canvas.width / resolution);
        rows = Math.ceil(canvas.height / resolution);
        if (!grid) grid = buildGrid();
        else {
            const newGrid = buildGrid();
            for (let i = 0; i < Math.min(grid.length, newGrid.length); i++) {
                for (let j = 0; j < Math.min(grid[i].length, newGrid[i].length); j++) {
                    newGrid[i][j] = grid[i][j];
                }
            }
            grid = newGrid;
        }
    }

    function buildGrid() {
        return new Array(cols).fill(null).map(() => new Array(rows).fill(0));
    }

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw grid lines
        ctx.strokeStyle = 'rgba(88, 88, 88, 0.1)';
        ctx.lineWidth = 1;

        for (let c = 0; c <= cols; c++) {
            ctx.beginPath();
            ctx.moveTo(c * resolution, 0);
            ctx.lineTo(c * resolution, canvas.height);
            ctx.stroke();
        }
        for (let r = 0; r <= rows; r++) {
            ctx.beginPath();
            ctx.moveTo(0, r * resolution);
            ctx.lineTo(canvas.width, r * resolution);
            ctx.stroke();
        }

        // Draw alive cells
        ctx.fillStyle = 'rgba(88, 88, 88, 0.4)';
        for (let c = 0; c < cols; c++) {
            for (let r = 0; r < rows; r++) {
                if (grid[c][r] === 1) {
                    ctx.fillRect(c * resolution, r * resolution, resolution, resolution);
                }
            }
        }
    }

    function update() {
        if (!isRunning) return;

        const nextGrid = grid.map(arr => [...arr]);

        for (let c = 0; c < cols; c++) {
            for (let r = 0; r < rows; r++) {
                let cell = grid[c][r];
                let neighbors = 0;

                for (let i = -1; i < 2; i++) {
                    for (let j = -1; j < 2; j++) {
                        if (i === 0 && j === 0) continue;
                        const x_cell = c + i;
                        const y_cell = r + j;

                        if (x_cell >= 0 && x_cell < cols && y_cell >= 0 && y_cell < rows) {
                            neighbors += grid[x_cell][y_cell];
                        }
                    }
                }

                if (cell === 1 && (neighbors < 2 || neighbors > 3)) {
                    nextGrid[c][r] = 0;
                } else if (cell === 0 && neighbors === 3) {
                    nextGrid[c][r] = 1;
                }
            }
        }
        grid = nextGrid;
    }

    function loop() {
        update();
        draw();
        setTimeout(() => {
            animationId = requestAnimationFrame(loop);
        }, 100);
    }

    function interact(e) {
        const x = e.clientX || e.touches[0].clientX;
        const y = e.clientY || e.touches[0].clientY;
        const c = Math.floor(x / resolution);
        const r = Math.floor(y / resolution);

        if (c >= 0 && c < cols && r >= 0 && r < rows) {
            grid[c][r] = 1;
            // Splash effect
            if (Math.random() > 0.5 && c + 1 < cols) grid[c + 1][r] = 1;
            if (Math.random() > 0.5 && r + 1 < rows) grid[c][r + 1] = 1;
            draw();

            if (!isRunning) {
                if (startTimer) clearTimeout(startTimer);
                startTimer = setTimeout(() => {
                    isRunning = true;
                }, 3000);
            }
        }
    }

    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        resizeCanvas();
        draw();
    });

    let isDrawing = false;
    window.addEventListener('mousedown', () => isDrawing = true);
    window.addEventListener('mouseup', () => isDrawing = false);
    window.addEventListener('mousemove', (e) => {
        if (isDrawing) interact(e);
    });

    window.addEventListener('touchstart', (e) => {
        isDrawing = true;
        interact(e);
    });
    window.addEventListener('touchend', () => isDrawing = false);
    window.addEventListener('touchmove', (e) => {
        if (isDrawing) interact(e);
    });

    resizeCanvas();
    loop();
}

function randomRange(min, max) {
    return Math.random() * (max - min) + min;
}

function randomBezier() {
    const x1 = randomRange(0.15, 0.45).toFixed(2);
    const y1 = randomRange(0.0, 0.25).toFixed(2);
    const x2 = randomRange(0.55, 0.9).toFixed(2);
    const y2 = randomRange(0.75, 1.0).toFixed(2);
    return `cubic-bezier(${x1}, ${y1}, ${x2}, ${y2})`;
}

function animateGrabNudge(grab) {
    if (!grab || typeof grab.animate !== 'function') return;

    grab.getAnimations().forEach(a => a.cancel());

    const rightShift = randomRange(18, 34);
    const leftShift = randomRange(9, 20);
    const settleShift = randomRange(2, 8);

    const firstLeg = randomRange(110, 190);
    const secondLeg = randomRange(150, 240);
    const thirdLeg = randomRange(120, 220);
    const total = firstLeg + secondLeg + thirdLeg;

    const o1 = firstLeg / total;
    const o2 = (firstLeg + secondLeg) / total;

    grab.animate(
        [
            { transform: 'translate(calc(-50% + 0px), -50%)', offset: 0, easing: randomBezier() },
            { transform: `translate(calc(-50% + ${rightShift.toFixed(1)}px), -50%)`, offset: o1, easing: randomBezier() },
            { transform: `translate(calc(-50% - ${leftShift.toFixed(1)}px), -50%)`, offset: o2, easing: randomBezier() },
            { transform: `translate(calc(-50% + ${settleShift.toFixed(1)}px), -50%)`, offset: 0.92, easing: randomBezier() },
            { transform: 'translate(calc(-50% + 0px), -50%)', offset: 1 }
        ],
        {
            duration: total,
            fill: 'forwards'
        }
    );
}

// Initialization and Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    setupTapHint();
    fetchBlogPosts();

    document.querySelectorAll('.img img, .grab').forEach((image) => {
        image.addEventListener('dragstart', (event) => event.preventDefault());
    });

    const grab = document.querySelector('.grab');
    if (grab) {
        grab.addEventListener('click', () => animateGrabNudge(grab));
        grab.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                animateGrabNudge(grab);
            }
        });
    }

    // Background Color Picker
    const bgColorInput = document.getElementById('bgColor');
    if (bgColorInput) {
        bgColorInput.addEventListener('input', (event) => {
            document.body.style.backgroundColor = event.target.value;
        });
    }

    // Git Commit Fetcher
    getMyLatestCommit().then(c => {
        const elem = document.querySelector('.commit');
        if (elem) {
            if (c) {
                elem.innerHTML = `<small>[${c.date}] ${c.repository} <br>~ ${c.message} <a href="${c.url}">${c.hash}</a></small>`;
            } else {
                elem.innerHTML = `<small>Last commit: <a href="https://github.com/ohaswin">unavailable</a></small>`;
            }
        }
    });

    // Start Game of Life
    initGameOfLife();
});
