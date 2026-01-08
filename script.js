function deltadate(date) {
    const now = new Date();
    const diff = now - new Date(date);
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    return days > 0 ? `${days} days ago` : 'today';
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

async function getMyLatestCommit() {
    try {
        const response = await fetch(`https://api.github.com/users/ohaswin/events?per_page=10`);
        const events = await response.json();

        const pushEvent = events.find(event => event.type === 'PushEvent');
        if (!pushEvent) {
            throw new Error('No recent commits found');
        }

        const latestCommit = pushEvent.payload.commits[pushEvent.payload.commits.length - 1];
        const repoName = pushEvent.repo.name;

        return {
            repository: repoName.replace('ohaswin/', ''),
            hash: latestCommit.sha.substring(0, 7),
            fullHash: latestCommit.sha,
            message: latestCommit.message,
            author: latestCommit.author.name,
            date: deltadate(pushEvent.created_at),
            url: `https://github.com/${repoName}/commit/${latestCommit.sha}`
        };
    } catch (error) {
        console.error('Error fetching commit:', error);
        return null;
    }
}

let toggle = true;
const isMobile = window.matchMedia("(max-width: 768px)").matches;

function flip() {
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
        `<br>I'm a second year CS undergrad. Former freelancer, now I study distributed systems, cellular networks, systems programming and build software I find interesting or useful.<br><br>Built: <a href="https://github.com/ohaswin/pyscan">pyscan</a> (30k+ downloads)<br>Building: <a href="https://github.com/ohaswin/bookends">bookends</a> (WIP)<br><a href="https://linkedin.com/in/ohaswin">LinkedIn</a> | <a href="https://github.com/ohaswin">GitHub</a> | <a href="/resume.pdf">CV</a>`;
    toggle = !toggle;
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

// Initialization and Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    fetchBlogPosts();

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
