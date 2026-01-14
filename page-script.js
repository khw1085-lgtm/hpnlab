// Initialize dot animation for page
function initPageDotAnimation() {
    const canvas = document.getElementById('page-canvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');

    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    // Mouse position
    let mouseX = -1000;
    let mouseY = -1000;
    let prevMouseX = -1000;
    let prevMouseY = -1000;

    // Dot grid settings - same as main page
    const dotSpacing = 15; // Space between dots (same as main)
    const dotRadius = 1.2; // Base dot size (same as main)
    const mouseRadius = 250; // Mouse influence radius (same as main)
    const pullStrength = 0.25; // Magnetic pull strength (same as main)
    const velocityInfluence = 0.8; // How much mouse velocity affects dots

    // Create dot grid
    const dots = [];
    for (let x = 0; x < width; x += dotSpacing) {
        for (let y = 0; y < height; y += dotSpacing) {
            dots.push({
                x: x,
                y: y,
                originalX: x,
                originalY: y,
                vx: 0,
                vy: 0
            });
        }
    }

    // Mouse move handler
    canvas.addEventListener('mousemove', (e) => {
        prevMouseX = mouseX;
        prevMouseY = mouseY;
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    canvas.addEventListener('mouseleave', () => {
        mouseX = -1000;
        mouseY = -1000;
    });

    // Check if white theme
    const isWhiteTheme = document.querySelector('.page-container.white-theme') !== null;
    
    // Animation loop
    function animate() {
        // Clear canvas with transparent background
        ctx.clearRect(0, 0, width, height);

        // Calculate mouse velocity
        const mouseVelX = mouseX - prevMouseX;
        const mouseVelY = mouseY - prevMouseY;

        // Update and draw dots
        dots.forEach(dot => {
            // Calculate distance from mouse
            const dx = mouseX - dot.x;
            const dy = mouseY - dot.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < mouseRadius) {
                // Magnetic field effect
                const distanceRatio = 1 - distance / mouseRadius;
                const magneticForce = distanceRatio * distanceRatio * pullStrength; // Quadratic falloff
                
                // Pull towards mouse
                const angle = Math.atan2(dy, dx);
                dot.vx += Math.cos(angle) * magneticForce;
                dot.vy += Math.sin(angle) * magneticForce;
                
                // Add mouse velocity influence (flow effect)
                dot.vx += mouseVelX * velocityInfluence * distanceRatio;
                dot.vy += mouseVelY * velocityInfluence * distanceRatio;
                
                // Slight orbital motion for more fluid feel
                const orbitalForce = distanceRatio * 0.02;
                dot.vx += -Math.sin(angle) * orbitalForce;
                dot.vy += Math.cos(angle) * orbitalForce;
            }

            // Apply velocity with damping
            dot.x += dot.vx;
            dot.y += dot.vy;
            dot.vx *= 0.88; // Smooth damping
            dot.vy *= 0.88;

            // Elastic return to original position
            const returnForce = 0.05;
            const returnDx = dot.originalX - dot.x;
            const returnDy = dot.originalY - dot.y;
            dot.vx += returnDx * returnForce;
            dot.vy += returnDy * returnForce;

            // Calculate size based on distance from mouse
            let size = dotRadius;
            if (distance < mouseRadius) {
                size = dotRadius + (1 - distance / mouseRadius) * 2; // Reduced size increase
            }

            // Calculate opacity based on distance from mouse
            let opacity = isWhiteTheme ? 0.15 : 0.3; // Lighter dots for white theme
            let color = isWhiteTheme ? { r: 0, g: 0, b: 0 } : { r: 255, g: 255, b: 255 }; // Default black or white
            
            if (distance < mouseRadius) {
                opacity = 0.3 + (1 - distance / mouseRadius) * 0.7;
                
                if (!isWhiteTheme) {
                    // Color based on position (horizontal gradient) - only for dark theme
                    const hue = (dot.originalX / width) * 360;
                    const sat = 85; // More vibrant
                    const light = 60; // Brighter
                    
                    // Convert HSL to RGB
                    const c = (1 - Math.abs(2 * light / 100 - 1)) * sat / 100;
                    const x = c * (1 - Math.abs((hue / 60) % 2 - 1));
                    const m = light / 100 - c / 2;
                    
                    let r, g, b;
                    if (hue < 60) {
                        r = c; g = x; b = 0;
                    } else if (hue < 120) {
                        r = x; g = c; b = 0;
                    } else if (hue < 180) {
                        r = 0; g = c; b = x;
                    } else if (hue < 240) {
                        r = 0; g = x; b = c;
                    } else if (hue < 300) {
                        r = x; g = 0; b = c;
                    } else {
                        r = c; g = 0; b = x;
                    }
                    
                    color.r = Math.round((r + m) * 255);
                    color.g = Math.round((g + m) * 255);
                    color.b = Math.round((b + m) * 255);
                }
            }

            // Draw dot
            ctx.beginPath();
            ctx.arc(dot.x, dot.y, size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${opacity})`;
            ctx.fill();
        });

        requestAnimationFrame(animate);
    }

    // Handle window resize
    window.addEventListener('resize', () => {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;

        dots.length = 0;
        for (let x = 0; x < width; x += dotSpacing) {
            for (let y = 0; y < height; y += dotSpacing) {
                dots.push({
                    x: x,
                    y: y,
                    originalX: x,
                    originalY: y,
                    vx: 0,
                    vy: 0
                });
            }
        }
    });

    animate();
}

// Page load animation
function initPageLoadAnimation() {
    // Check if white theme and add class to body FIRST
    const isWhiteTheme = document.querySelector('.page-container.white-theme') !== null;
    if (isWhiteTheme) {
        document.body.classList.add('white-page');
    }
    
    // Add loading class
    document.body.classList.add('loading');
    
    // Remove loading class after a short delay to trigger animation
    setTimeout(() => {
        document.body.classList.remove('loading');
    }, 100);
}

// Initialize header logo click handler
function initHeaderLogo() {
    const headerLogo = document.getElementById('header-logo');
    if (headerLogo) {
        headerLogo.addEventListener('click', () => {
            window.location.href = '/';
        });
    }
}


// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initPageLoadAnimation();
        initPageDotAnimation();
        initHeaderLogo();
    });
} else {
    initPageLoadAnimation();
    initPageDotAnimation();
    initHeaderLogo();
}
