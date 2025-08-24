
// DOM Elements
const currentDateElement = document.getElementById('current-date');
const currentMoonElement = document.getElementById('current-moon');
const phaseNameElement = document.getElementById('phase-name');
const phasePoetryElement = document.getElementById('phase-poetry');
const illuminationElement = document.getElementById('illumination');
const illuminationBarElement = document.getElementById('illumination-bar');
const nextPhaseElement = document.getElementById('next-phase');
const timeUntilElement = document.getElementById('time-until');
const toggleForecastButton = document.getElementById('toggle-forecast');
const forecastContainer = document.getElementById('forecast-container');
const forecastGrid = document.getElementById('forecast-grid');
const toggleIcon = document.getElementById('toggle-icon');
const moonriseTimeElement = document.getElementById('moonrise-time');
const moonsetTimeElement = document.getElementById('moonset-time');
const lunarArcElement = document.getElementById('lunar-arc');
const arcPathElement = document.getElementById('arc-path');
const moonPositionElement = document.getElementById('moon-position');

// Application State
let isLoading = false;

function formatDate(date) {
    return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    }).toUpperCase();
}

function formatTime(date) {
    return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
}

function getTimeUntilNextPhase(currentFraction) {
    // Find next major phase transition
    const majorPhases = [0, 0.25, 0.5, 0.75, 1];
    let nextPhase = majorPhases.find(phase => phase > currentFraction);
    if (!nextPhase) nextPhase = 1; // Next new moon
    
    // Approximate days until next phase (lunar cycle is ~29.5 days)
    const daysInCycle = 29.53;
    const daysTillNext = (nextPhase - currentFraction) * daysInCycle;
    
    if (daysTillNext < 1) {
        const hours = Math.round(daysTillNext * 24);
        return `${hours} hour${hours !== 1 ? 's' : ''}`;
    } else {
        const days = Math.round(daysTillNext);
        return `${days} day${days !== 1 ? 's' : ''}`;
    }
}

function getNextPhaseName(currentFraction) {
    const phases = [
        { threshold: 0.03, name: 'Waxing Crescent' },
        { threshold: 0.22, name: 'First Quarter' },
        { threshold: 0.28, name: 'Waxing Gibbous' },
        { threshold: 0.47, name: 'Full Moon' },
        { threshold: 0.53, name: 'Waning Gibbous' },
        { threshold: 0.72, name: 'Last Quarter' },
        { threshold: 0.78, name: 'Waning Crescent' },
        { threshold: 0.97, name: 'New Moon' },
        { threshold: 1, name: 'New Moon' }
    ];
    
    const nextPhase = phases.find(phase => currentFraction < phase.threshold);
    return nextPhase ? nextPhase.name : 'New Moon';
}

function showLoading() {
    if (currentMoonElement) {
        currentMoonElement.innerHTML = '<div class="loading-shimmer w-32 h-32 rounded-full"></div>';
    }
    if (phaseNameElement) {
        phaseNameElement.textContent = 'Loading...';
    }
}

function updateCurrentMoon() {
    try {
        showLoading();
        
        const now = new Date();
        currentDateElement.textContent = formatDate(now);

        const moonIllumination = SunCalc.getMoonIllumination(now);
        const fraction = moonIllumination.fraction;
        const phaseName = window.moon.getPhaseName(fraction);

        // Create moon SVG with enhanced animation
        const svgIcon = window.moon.createMoonSvg(fraction, phaseName);
        currentMoonElement.innerHTML = '';
        currentMoonElement.appendChild(svgIcon);
        
        // Add ambient pulse when not actively being interacted with
        setTimeout(() => {
            if (svgIcon && !svgIcon.classList.contains('gyroscope-active')) {
                svgIcon.classList.add('ambient-pulse');
            }
        }, 2000);

        // Update phase information with poetry
        const currentPhase = window.moon.phases.find(p => fraction >= p.start && fraction < p.end);
        phaseNameElement.textContent = phaseName.toLowerCase();
        if (currentPhase && phasePoetryElement) {
            phasePoetryElement.textContent = currentPhase.poetry;
        }
        illuminationElement.textContent = `${(fraction * 100).toFixed(0)}% illuminated`.toUpperCase();
        
        // Update illumination progress bar
        if (illuminationBarElement) {
            illuminationBarElement.style.width = `${(fraction * 100)}%`;
        }
        
        // Add next phase information
        if (nextPhaseElement && timeUntilElement) {
            nextPhaseElement.textContent = getNextPhaseName(fraction).toLowerCase();
            timeUntilElement.textContent = getTimeUntilNextPhase(fraction);
        }
        
        // Update lunar trajectory arc
        updateLunarArc(now);
        
    } catch (error) {
        console.error('Error updating moon phase:', error);
        phaseNameElement.textContent = 'Error loading moon data';
        illuminationElement.textContent = 'Please refresh the page';
    }
}

function updateLunarArc(date) {
    try {
        // Simplified arc - always show the path
        if (arcPathElement) {
            arcPathElement.setAttribute("d", "M 20 60 Q 100 15 180 60");
        }
        
        // Get current time for position calculation
        const now = new Date();
        const currentHour = now.getHours();
        
        // Simplified timing (you can enhance this with real SunCalc data later)
        let moonriseHour = 19; // Evening moonrise as example
        let moonsetHour = 7;   // Morning moonset as example
        
        // Display times (simplified)
        if (moonriseTimeElement) {
            moonriseTimeElement.textContent = `${moonriseHour.toString().padStart(2, '0')}:00`;
        }
        if (moonsetTimeElement) {
            moonsetTimeElement.textContent = `${moonsetHour.toString().padStart(2, '0')}:00`;
        }
        
        // Calculate moon position on arc (simplified)
        let progress = 0.3; // Default position
        
        if (currentHour >= 19 || currentHour <= 7) {
            // Moon is "up" - calculate position
            let totalHours = 12; // 19:00 to 07:00 next day
            let currentPosition;
            
            if (currentHour >= 19) {
                currentPosition = currentHour - 19; // Hours since moonrise
            } else {
                currentPosition = currentHour + 5; // Hours since midnight (19+5=24, so 0-7 becomes 5-12)
            }
            
            progress = currentPosition / totalHours;
        }
        
        // Apply position to moon indicator
        const x = 20 + (progress * 160);
        const y = 60 - Math.sin(progress * Math.PI) * 45;
        
        if (moonPositionElement) {
            moonPositionElement.setAttribute("cx", x);
            moonPositionElement.setAttribute("cy", y);
        }
        
    } catch (error) {
        console.log('Error updating lunar arc:', error);
        // Fallback
        if (moonriseTimeElement) moonriseTimeElement.textContent = '19:00';
        if (moonsetTimeElement) moonsetTimeElement.textContent = '07:00';
    }
}

function toggleForecast() {
    const isOpen = forecastContainer.classList.contains('open');
    
    if (isOpen) {
        forecastContainer.classList.remove('open');
        toggleIcon.textContent = '→';
        toggleIcon.style.transform = 'rotate(0deg)';
    } else {
        forecastContainer.classList.add('open');
        toggleIcon.textContent = '↓';
        toggleIcon.style.transform = 'rotate(90deg)';
        populateForecast();
    }
}

function populateForecast() {
    forecastGrid.innerHTML = '';
    
    try {
        for (let i = 1; i <= 7; i++) {
            const forecastDate = new Date();
            forecastDate.setDate(forecastDate.getDate() + i);

            const moonIllumination = SunCalc.getMoonIllumination(forecastDate);
            const fraction = moonIllumination.fraction;
            const phaseName = window.moon.getPhaseName(fraction);

            // Create forecast item
            const forecastItem = document.createElement('div');
            forecastItem.className = 'forecast-item hover-lift';

            // Date display
            const dateElement = document.createElement('div');
            dateElement.className = 'text-xs uppercase tracking-widest text-gray-500 mb-2 sm:mb-3';
            dateElement.style.fontFamily = "'Inter', sans-serif";
            dateElement.textContent = forecastDate.toLocaleDateString('en-US', { 
                weekday: 'short', 
                month: 'short', 
                day: 'numeric' 
            }).toUpperCase();

            // Moon display container
            const moonElement = document.createElement('div');
            moonElement.className = 'w-12 h-12 sm:w-16 sm:h-16 lg:w-12 lg:h-12 xl:w-14 xl:h-14 mx-auto mb-2 sm:mb-3 flex-shrink-0';
            const svgIcon = window.moon.createMoonSvg(fraction, phaseName);
            svgIcon.setAttribute('width', '100%');
            svgIcon.setAttribute('height', '100%');
            moonElement.appendChild(svgIcon);

            // Phase name
            const phaseElement = document.createElement('div');
            phaseElement.className = 'text-white text-base font-light mb-1 sm:mb-2 leading-tight';
            phaseElement.style.fontFamily = "'Crimson Text', serif";
            phaseElement.style.fontSize = 'clamp(0.875rem, 2.5vw, 1rem)';
            phaseElement.textContent = phaseName.toLowerCase();

            // Illumination percentage
            const illuminationEl = document.createElement('div');
            illuminationEl.className = 'text-sm uppercase tracking-widest text-gray-600 leading-tight';
            illuminationEl.style.fontFamily = "'Inter', sans-serif";
            illuminationEl.style.fontSize = 'clamp(0.75rem, 2vw, 0.875rem)';
            illuminationEl.textContent = `${(fraction * 100).toFixed(0)}%`;

            // Assemble forecast item
            forecastItem.appendChild(dateElement);
            forecastItem.appendChild(moonElement);
            forecastItem.appendChild(phaseElement);
            forecastItem.appendChild(illuminationEl);

            forecastGrid.appendChild(forecastItem);
        }
    } catch (error) {
        console.error('Error populating forecast:', error);
        forecastGrid.innerHTML = '<div class="col-span-full text-center text-gray-400">Error loading forecast data</div>';
    }
}

// Event Listeners
toggleForecastButton.addEventListener('click', toggleForecast);

// Auto-update moon phase every minute
setInterval(updateCurrentMoon, 60000);

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    updateCurrentMoon();
});

// Handle page visibility changes for smooth animations
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
        updateCurrentMoon();
    }
});

// Constellation cursor trail effect
let lastTrailTime = 0;
const trailInterval = 100; // Create trail every 100ms

function createConstellationTrail(e) {
    const now = Date.now();
    if (now - lastTrailTime < trailInterval) return;
    lastTrailTime = now;

    const trail = document.createElement('div');
    const variants = ['constellation-trail', 'constellation-trail small', 'constellation-trail large'];
    const randomVariant = variants[Math.floor(Math.random() * variants.length)];
    
    trail.className = randomVariant;
    trail.style.left = e.clientX + 'px';
    trail.style.top = e.clientY + 'px';
    
    document.body.appendChild(trail);
    
    // Remove trail element after animation
    setTimeout(() => {
        if (trail.parentNode) {
            trail.parentNode.removeChild(trail);
        }
    }, 2000);
}

// Add constellation trail to mouse movement
document.addEventListener('mousemove', createConstellationTrail);

// Moon orientation tracking
let moonOrientation = { x: 0, y: 0, tilt: 0 };
let isGyroscopeAvailable = false;

// Mouse-based moon orientation for desktop
function handleMouseMovement(e) {
    if (window.innerWidth < 768) return; // Skip on mobile
    
    const rect = currentMoonElement.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // Calculate relative position (-1 to 1)
    const relativeX = (e.clientX - centerX) / (rect.width / 2);
    const relativeY = (e.clientY - centerY) / (rect.height / 2);
    
    // Limit the range and make it subtle
    moonOrientation.x = Math.max(-0.3, Math.min(0.3, relativeX * 0.2));
    moonOrientation.y = Math.max(-0.3, Math.min(0.3, relativeY * 0.2));
    
    updateMoonOrientation();
}

// Gyroscope-based moon orientation for mobile
function handleDeviceOrientation(e) {
    if (window.innerWidth >= 768) return; // Skip on desktop
    
    // Convert device orientation to moon orientation
    const beta = e.beta || 0;  // Front-to-back tilt (-180 to 180)
    const gamma = e.gamma || 0; // Left-to-right tilt (-90 to 90)
    
    // Normalize and make subtle
    moonOrientation.x = Math.max(-0.4, Math.min(0.4, gamma / 90 * 0.3));
    moonOrientation.y = Math.max(-0.4, Math.min(0.4, (beta - 90) / 90 * 0.2));
    moonOrientation.tilt = Math.max(-15, Math.min(15, gamma * 0.3));
    
    updateMoonOrientation();
}

// Apply orientation changes to the moon
function updateMoonOrientation() {
    if (!currentMoonElement) return;
    
    const moonSvg = currentMoonElement.querySelector('.moon-svg');
    if (moonSvg) {
        // Remove ambient pulse when actively interacting
        moonSvg.classList.remove('ambient-pulse');
        
        const translateX = moonOrientation.x * 8; // Subtle movement
        const translateY = moonOrientation.y * 8;
        const rotateZ = moonOrientation.tilt;
        const scale = 1 + Math.abs(moonOrientation.x * 0.05) + Math.abs(moonOrientation.y * 0.05);
        
        // Enhanced shadow based on position
        const shadowIntensity = 0.8 + Math.abs(moonOrientation.x * 0.2) + Math.abs(moonOrientation.y * 0.2);
        const shadowBlur = 8 + Math.abs(moonOrientation.x * 4) + Math.abs(moonOrientation.y * 4);
        
        moonSvg.style.transform = `
            translate3d(${translateX}px, ${translateY}px, 0)
            rotateZ(${rotateZ}deg)
            scale(${scale})
        `;
        moonSvg.style.filter = `
            drop-shadow(0 2px ${shadowBlur}px rgba(0, 0, 0, ${shadowIntensity}))
            drop-shadow(${moonOrientation.x * 3}px ${moonOrientation.y * 3}px 6px rgba(0, 0, 0, 0.4))
        `;
        
        // Add a subtle glow effect based on movement
        const glowIntensity = Math.abs(moonOrientation.x) + Math.abs(moonOrientation.y);
        if (glowIntensity > 0.1) {
            moonSvg.style.filter += ` drop-shadow(0 0 ${glowIntensity * 20}px rgba(255, 255, 255, 0.1))`;
        }
    }
}

// Request gyroscope permission on mobile
async function requestGyroscopePermission() {
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
        try {
            const permission = await DeviceOrientationEvent.requestPermission();
            if (permission === 'granted') {
                isGyroscopeAvailable = true;
                window.addEventListener('deviceorientation', handleDeviceOrientation);
                // Add gyroscope class for enhanced animations
                const moonSvg = currentMoonElement?.querySelector('.moon-svg');
                if (moonSvg) {
                    moonSvg.classList.add('gyroscope-active');
                    moonSvg.classList.remove('ambient-pulse');
                }
                return true;
            }
        } catch (error) {
            console.log('Gyroscope permission denied:', error);
        }
    } else if ('DeviceOrientationEvent' in window) {
        // Android devices don't need permission
        isGyroscopeAvailable = true;
        window.addEventListener('deviceorientation', handleDeviceOrientation);
        // Add gyroscope class for enhanced animations
        const moonSvg = currentMoonElement?.querySelector('.moon-svg');
        if (moonSvg) {
            moonSvg.classList.add('gyroscope-active');
            moonSvg.classList.remove('ambient-pulse');
        }
        return true;
    }
    return false;
}

// Show gyroscope permission prompt
function showGyroscopePrompt() {
    const prompt = document.getElementById('gyroscope-prompt');
    const enableBtn = document.getElementById('enable-gyroscope');
    const skipBtn = document.getElementById('skip-gyroscope');
    
    if (!prompt) return;
    
    prompt.classList.remove('hidden');
    
    enableBtn.addEventListener('click', async () => {
        prompt.classList.add('hidden');
        const enabled = await requestGyroscopePermission();
        if (!enabled) {
            // Fallback to ambient pulse if permission denied
            setTimeout(() => {
                const moonSvg = currentMoonElement?.querySelector('.moon-svg');
                if (moonSvg) moonSvg.classList.add('ambient-pulse');
            }, 1000);
        }
    });
    
    skipBtn.addEventListener('click', () => {
        prompt.classList.add('hidden');
        // Add ambient pulse instead
        setTimeout(() => {
            const moonSvg = currentMoonElement?.querySelector('.moon-svg');
            if (moonSvg) moonSvg.classList.add('ambient-pulse');
        }, 1000);
    });
}

// Initialize orientation tracking
function initializeOrientationTracking() {
    // Desktop mouse tracking
    if (window.innerWidth >= 768) {
        document.addEventListener('mousemove', handleMouseMovement);
    } else {
        // Mobile gyroscope tracking - show prompt after a delay
        setTimeout(() => {
            if ('DeviceOrientationEvent' in window) {
                showGyroscopePrompt();
            } else {
                // No gyroscope support, use ambient pulse
                setTimeout(() => {
                    const moonSvg = currentMoonElement?.querySelector('.moon-svg');
                    if (moonSvg) moonSvg.classList.add('ambient-pulse');
                }, 1000);
            }
        }, 3000); // Show prompt after 3 seconds
    }
    
    // Handle window resize
    window.addEventListener('resize', () => {
        if (window.innerWidth >= 768) {
            document.removeEventListener('deviceorientation', handleDeviceOrientation);
            document.addEventListener('mousemove', handleMouseMovement);
        } else {
            document.removeEventListener('mousemove', handleMouseMovement);
            if (!isGyroscopeAvailable) {
                requestGyroscopePermission();
            }
        }
    });
}

// Initialize immediately if DOM is already loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        updateCurrentMoon();
        initializeOrientationTracking();
    });
} else {
    updateCurrentMoon();
    initializeOrientationTracking();
}
