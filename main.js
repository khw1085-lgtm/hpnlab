import './style.css'
import gsap from 'gsap'

const container = document.querySelector('#app');
let hasNavigated = false;

function goToMain() {
    if (hasNavigated) return;
    hasNavigated = true;
    window.location.replace('/main.html');
}

// Utility function to get pixel data from text
function getTextPixelData(text, fontSize, fontWeight, font, canvasWidth, canvasHeight) {
    const canvas = document.createElement('canvas');
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    const ctx = canvas.getContext('2d');
    
    // Draw text
    ctx.fillStyle = 'white';
    ctx.font = `${fontWeight} ${fontSize}px ${font}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, canvasWidth / 2, canvasHeight / 2);
    
    // Sample pixels to create dots
    const imageData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
    const pixels = [];
    const samplingRate = 3; // Sample every 3 pixels for denser dots
    
    for (let y = 0; y < canvasHeight; y += samplingRate) {
        for (let x = 0; x < canvasWidth; x += samplingRate) {
            const index = (y * canvasWidth + x) * 4;
            const alpha = imageData.data[index + 3];
            
            if (alpha > 128) { // If pixel is part of text
                pixels.push({ x, y });
            }
        }
    }
    
    return pixels;
}

// Initialize loading page dots
function initLoadingDots() {
    const canvas = document.getElementById('loading-canvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const dotSpacing = 15;
    const dotRadius = 1.2;
    const dots = [];
    
    // Create dot grid without text mask
    for (let x = 0; x < width; x += dotSpacing) {
        for (let y = 0; y < height; y += dotSpacing) {
            dots.push({
                x: x,
                y: y,
                originalX: x,
                originalY: y,
                waveOffset: 0
            });
        }
    }
    
    let animationId;
    let waveProgress = 0;
    
    function animate() {
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, width, height);
        
        dots.forEach(dot => {
            // Color based on position (horizontal gradient) - more vibrant
            const hue = (dot.originalX / width) * 360;
            const sat = 85;
            const light = 60;
            
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
            
            const color = {
                r: Math.round((r + m) * 255),
                g: Math.round((g + m) * 255),
                b: Math.round((b + m) * 255)
            };
            
            ctx.beginPath();
            ctx.arc(dot.x, dot.y + dot.waveOffset, dotRadius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, 0.3)`;
            ctx.fill();
        });
        
        animationId = requestAnimationFrame(animate);
    }
    
    animate();
    
    return { canvas, ctx, dots, stopAnimation: () => cancelAnimationFrame(animationId) };
}

function init() {
    if (!container) return;
    
    // Hide main content initially
    const mainContent = document.querySelector('#main-content');
    if (mainContent) {
        gsap.set(mainContent, {
            y: window.innerHeight,
            opacity: 0,
            visibility: 'hidden'
        });
    }

    // Create WYND23 text wrapper (but don't clear container yet to preserve canvas)
    const wordWrapper = document.createElement('div');
    wordWrapper.className = 'word-wrapper';
    
    // Create container for letters
    const lettersContainer = document.createElement('div');
    
    // Only remove existing word-wrapper if it exists
    const existingWrapper = container.querySelector('.word-wrapper');
    if (existingWrapper) {
        existingWrapper.remove();
    }
    
    wordWrapper.appendChild(lettersContainer);
    container.appendChild(wordWrapper);
    
    // Initialize loading dots after DOM is set up
    const loadingDotsData = initLoadingDots();

    const text = 'WYND23';
    const letters = [];
    
    // Create letters with dot canvas
    text.split('').forEach((char, index) => {
        const span = document.createElement('span');
        span.className = 'letter';
        
        // Create canvas for each letter
        const letterCanvas = document.createElement('canvas');
        letterCanvas.width = 50;
        letterCanvas.height = 50;
        letterCanvas.style.position = 'absolute';
        letterCanvas.style.top = '0';
        letterCanvas.style.left = '0';
        
        const letterCtx = letterCanvas.getContext('2d');
        
        // Draw letter as text mask
        letterCtx.fillStyle = 'white';
        letterCtx.font = 'bold 32px system-ui';
        letterCtx.textAlign = 'center';
        letterCtx.textBaseline = 'middle';
        letterCtx.fillText(char, 25, 25);
        
        // Create dots for this letter
        const letterDots = [];
        const dotSpacing = 3;
        for (let x = 0; x < 50; x += dotSpacing) {
            for (let y = 0; y < 50; y += dotSpacing) {
                const pixelData = letterCtx.getImageData(x, y, 1, 1).data;
                if (pixelData[3] > 128) {
                    letterDots.push({ x, y });
                }
            }
        }
        
        // Store letter data
        span.letterCanvas = letterCanvas;
        span.letterDots = letterDots;
        span.appendChild(letterCanvas);
        
        lettersContainer.appendChild(span);
        letters.push(span);
        
        // Animate dots for this letter
        function animateLetterDots() {
            letterCtx.clearRect(0, 0, 50, 50);
            letterDots.forEach(dot => {
                letterCtx.beginPath();
                letterCtx.arc(dot.x, dot.y, 1.5, 0, Math.PI * 2);
                letterCtx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                letterCtx.fill();
            });
            requestAnimationFrame(animateLetterDots);
        }
        animateLetterDots();
    });
    
    // Create loading percentage element
    const percentageElement = document.createElement('div');
    percentageElement.className = 'loading-percentage';
    percentageElement.textContent = '0%';
    wordWrapper.appendChild(percentageElement);
    
    // Total animation duration
    const totalDuration = 2.2;

    // Calculate final Y position - centered
    const finalY = 0; // Centered position
    
    let completedLetters = 0;
    
    // Animate loading percentage from 0 to 100
    gsap.to({ value: 0 }, {
        value: 100,
        duration: totalDuration,
        ease: "power2.out",
        onUpdate: function() {
            const currentValue = Math.round(this.targets()[0].value);
            percentageElement.textContent = currentValue + '%';
        }
    });
    
    // Animate letters falling with impactful rotation and spring effect
    letters.forEach((letter, index) => {
        // More impactful rotation for each letter
        const randomRotation = (Math.random() * 360) - 180; // -180 to 180 degrees
        // Stagger delay for sequential effect
        const delay = index * 0.25; // 0s, 0.25s, 0.5s
        // Small X offset
        const randomX = (Math.random() * 100) - 50; // -50 to 50px
        // Small Y starting position variation - reduced height
        const randomYOffset = Math.random() * 30;
        
        // Initial state - start from above with rotation (reduced height)
        gsap.set(letter, {
            y: -window.innerHeight * 0.5 - randomYOffset, // Reduced from full height
            x: randomX,
            rotation: randomRotation,
            opacity: 0,
            scale: 0.8
        });
        
        // Falling animation with rotation - subtle spring effect
        gsap.to(letter, {
            y: finalY, // Final position - centered
            x: 0,
            rotation: 0, // Rotate back to 0 as it falls
            opacity: 1,
            scale: 1,
            duration: totalDuration - delay, // Each letter takes remaining time
            delay: delay,
            ease: "elastic.out(1, 0.6)", // Less bouncy spring effect
            onComplete: () => {
                completedLetters++;
                // When all letters have completed, start scroll animation
                if (completedLetters === letters.length) {
                    scrollToMain(letters, loadingDotsData);
                }
            }
        });
    });

    // Click to skip
    container.addEventListener('click', () => {
        scrollToMain(letters, loadingDotsData);
    });
    container.addEventListener('wheel', () => {
        scrollToMain(letters, loadingDotsData);
    });
}

function scrollToMain(letters, loadingDotsData) {
    if (hasNavigated) return;
    hasNavigated = true;
    
    // Get main content element
    const mainContent = document.querySelector('#main-content');
    if (!mainContent) {
        // Fallback: navigate to main page
        window.location.replace('/main.html');
        return;
    }
    
    // Quick fade out for loading dots (simultaneous with page transition)
    if (loadingDotsData && loadingDotsData.dots) {
        const { ctx, dots, canvas } = loadingDotsData;
        const width = canvas.width;
        const height = canvas.height;
        
        // Single quick fade out animation (0.8 seconds)
        gsap.to({}, {
            duration: 0.8,
            ease: "power2.out",
            onUpdate: function() {
                const progress = this.progress();
                
                ctx.clearRect(0, 0, width, height);
                ctx.fillStyle = '#000';
                ctx.fillRect(0, 0, width, height);
                
                dots.forEach(dot => {
                    // Quick fade out with slight downward movement
                    const opacity = 0.4 * (1 - progress);
                    const moveY = progress * 50; // Subtle downward drift
                    
                    if (opacity > 0.01) {
                        // Color based on position - vibrant
                        const hue = (dot.originalX / width) * 360;
                        const sat = 85;
                        const light = 60;
                        
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
                        
                        const color = {
                            r: Math.round((r + m) * 255),
                            g: Math.round((g + m) * 255),
                            b: Math.round((b + m) * 255)
                        };
                        
                        ctx.beginPath();
                        ctx.arc(dot.x, dot.y + moveY, 1.2, 0, Math.PI * 2);
                        ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${opacity})`;
                        ctx.fill();
                    }
                });
            },
            onComplete: () => {
                // Clear canvas after animation
                ctx.clearRect(0, 0, width, height);
                loadingDotsData.stopAnimation();
                canvas.style.display = 'none';
                container.style.display = 'none';
            }
        });
    }
    
    // Ensure main content is hidden and positioned below
    gsap.set(mainContent, {
        y: window.innerHeight,
        opacity: 0,
        visibility: 'visible' // Make it visible for animation
    });
    
    // Animate each letter scattering in different directions while moving up
    letters.forEach((letter, index) => {
        // Random direction for each letter to scatter
        const angle = (index * 120) + (Math.random() * 60 - 30); // Spread in different directions
        const distance = 300 + Math.random() * 200; // Distance to scatter
        const scatterX = Math.cos(angle * Math.PI / 180) * distance;
        const scatterY = -window.innerHeight - 200 - (Math.sin(angle * Math.PI / 180) * distance);
        const scatterRotation = (Math.random() * 720) - 360; // Random rotation

        gsap.to(letter, {
            x: scatterX,
            y: scatterY,
            rotation: scatterRotation,
            opacity: 0,
            scale: 0.3,
            duration: 0.8,
            ease: "power2.in"
        });
    });
    
    // Fade out percentage text
    const percentageElement = document.querySelector('.loading-percentage');
    if (percentageElement) {
        gsap.to(percentageElement, {
            opacity: 0,
            y: -50,
            duration: 0.8,
            ease: "power2.inOut"
        });
    }
    
    // Animate container (loading page) moving up
    gsap.to(container, {
        y: -window.innerHeight,
        opacity: 0,
        duration: 0.8,
        ease: "power2.in"
    });
    
    // Animate main content scrolling up from below - simultaneously with loading page exit
    gsap.to(mainContent, {
        y: 0,
        opacity: 1,
        duration: 0.8,
        ease: "power2.out",
        delay: 0, // No delay - start immediately for crossfade effect
        onComplete: () => {
            // Initialize icon grid and dot animation after main content is visible
            initIconGrid();
            initDotAnimation();
            
            // Animate menu items from bottom to top with stagger
            animateMenuItems();
        }
    });
}

// Initialize icon grid
function initIconGrid() {
    const iconGrid = document.getElementById('icon-grid');
    if (!iconGrid) return;

    // UI Icon SVGs
    const icons = [
        // Home
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
        // Settings
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="3"/><path d="M12 1v6m0 6v6m5.7-13.7l-4.2 4.2m0 6l4.2 4.2M23 12h-6m-6 0H1m13.7 5.7l-4.2-4.2m0-6l-4.2-4.2"/></svg>',
        // Search
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>',
        // User
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
        // Heart
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>',
        // Star
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
        // Bell
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>',
        // Mail
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>',
        // Calendar
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
        // Camera
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>',
        // Music
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>',
        // Image
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>',
    ];

    // Calculate grid dimensions
    const gridWidth = window.innerWidth;
    const gridHeight = window.innerHeight;
    const itemSize = 80;
    const gap = 40;
    const cols = Math.floor(gridWidth / (itemSize + gap));
    const rows = Math.floor(gridHeight / (itemSize + gap));

    // Create icon elements
    const iconElements = [];
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const div = document.createElement('div');
            div.className = 'icon-grid-item';
            div.innerHTML = icons[Math.floor(Math.random() * icons.length)];
            div.style.gridColumn = col + 1;
            div.style.gridRow = row + 1;
            
            // Store position for hover detection
            div.dataset.x = col * (itemSize + gap) + gap + itemSize / 2;
            div.dataset.y = row * (itemSize + gap) + gap + itemSize / 2;
            
            iconGrid.appendChild(div);
            iconElements.push(div);
        }
    }

    // Mouse position tracking
    let mouseX = -1000;
    let mouseY = -1000;

    // Icon shape patterns (relative positions for forming shapes)
    const iconShapes = [
        // Heart shape
        [
            {x: 0, y: -2}, {x: -1, y: -2}, {x: 1, y: -2},
            {x: -2, y: -1}, {x: 2, y: -1},
            {x: -2, y: 0}, {x: 2, y: 0},
            {x: -1, y: 1}, {x: 0, y: 1}, {x: 1, y: 1},
            {x: 0, y: 2}
        ],
        // Star shape
        [
            {x: 0, y: -2},
            {x: -1, y: -1}, {x: 0, y: -1}, {x: 1, y: -1},
            {x: -2, y: 0}, {x: -1, y: 0}, {x: 0, y: 0}, {x: 1, y: 0}, {x: 2, y: 0},
            {x: -1, y: 1}, {x: 1, y: 1},
            {x: 0, y: 2}
        ],
        // Circle shape
        [
            {x: 0, y: -2}, {x: -1, y: -2}, {x: 1, y: -2},
            {x: -2, y: -1}, {x: 2, y: -1},
            {x: -2, y: 0}, {x: 2, y: 0},
            {x: -2, y: 1}, {x: 2, y: 1},
            {x: 0, y: 2}, {x: -1, y: 2}, {x: 1, y: 2}
        ],
        // Plus/Cross shape
        [
            {x: 0, y: -2},
            {x: 0, y: -1},
            {x: -2, y: 0}, {x: -1, y: 0}, {x: 0, y: 0}, {x: 1, y: 0}, {x: 2, y: 0},
            {x: 0, y: 1},
            {x: 0, y: 2}
        ]
    ];

    let currentShapeIndex = 0;

    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;

        // Select shape based on mouse position
        currentShapeIndex = Math.floor((mouseX / gridWidth) * iconShapes.length);
        const currentShape = iconShapes[currentShapeIndex];

        // Check distance to each icon
        iconElements.forEach(icon => {
            const iconX = parseFloat(icon.dataset.x);
            const iconY = parseFloat(icon.dataset.y);
            const dx = mouseX - iconX;
            const dy = mouseY - iconY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 300) { // Hover radius
                icon.classList.add('hover');
                
                // Find closest position in shape pattern
                let minShapeDist = Infinity;
                let targetShapePos = null;
                
                currentShape.forEach(shapePos => {
                    const shapePosX = mouseX + (shapePos.x * (itemSize + gap));
                    const shapePosY = mouseY + (shapePos.y * (itemSize + gap));
                    const shapeDx = iconX - shapePosX;
                    const shapeDy = iconY - shapePosY;
                    const shapeDist = Math.sqrt(shapeDx * shapeDx + shapeDy * shapeDy);
                    
                    if (shapeDist < minShapeDist) {
                        minShapeDist = shapeDist;
                        targetShapePos = {x: shapePosX, y: shapePosY};
                    }
                });

                // If icon is close to a shape position, make it part of the shape
                if (minShapeDist < 150) {
                    // Apply color based on position
                    const hue = (iconX / gridWidth) * 360;
                    const sat = 85 + (1 - minShapeDist / 150) * 15;
                    const light = 60 + (1 - minShapeDist / 150) * 20;
                    icon.style.color = `hsl(${hue}, ${sat}%, ${light}%)`;
                    icon.style.opacity = 0.5 + (1 - minShapeDist / 150) * 0.5;
                    icon.style.transform = `scale(${1.1 + (1 - minShapeDist / 150) * 0.3})`;
                } else {
                    icon.style.color = 'white';
                    icon.style.opacity = 0.08;
                    icon.style.transform = 'scale(1)';
                }
            } else {
                icon.classList.remove('hover');
                icon.style.color = 'white';
                icon.style.opacity = 0.08;
                icon.style.transform = 'scale(1)';
            }
        });
    });
}

// Dot animation for main content
function initDotAnimation() {
    const canvas = document.getElementById('canvas');
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

    // Dot grid settings
    const dotSpacing = 15; // Space between dots (reduced for tighter grid)
    const dotRadius = 1.2; // Base dot size (slightly smaller)
    const mouseRadius = 250; // Mouse influence radius (increased from 150)
    const pullStrength = 0.25; // Magnetic pull strength
    const velocityInfluence = 0.8; // How much mouse velocity affects dots

    // Create dot grid
    const dots = [];
    for (let x = 0; x < width; x += dotSpacing) {
        for (let y = 0; y < height; y += dotSpacing) {
            dots.push({
                x: x,
                y: y + height, // Start below viewport
                originalX: x,
                originalY: y,
                vx: 0,
                vy: 0,
                slideProgress: 0 // For slide-up animation
            });
        }
    }
    
    // Animate dots sliding up from bottom
    gsap.to(dots, {
        slideProgress: 1,
        duration: 0.8,
        ease: "power2.out",
        onUpdate: function() {
            const progress = dots[0].slideProgress;
            dots.forEach(dot => {
                dot.y = dot.originalY + height * (1 - progress);
            });
        },
        onComplete: function() {
            // Start magnetic sweep from right to left after dots are in place
            startMagneticSweep();
        }
    });
    
    // Magnetic sweep effect (right to left)
    let sweepX = width + mouseRadius;
    let sweepActive = false;
    
    function startMagneticSweep() {
        sweepActive = true;
        sweepX = width + mouseRadius;
        
        gsap.to({ x: sweepX }, {
            x: -mouseRadius,
            duration: 1.5,
            ease: "power1.inOut",
            onUpdate: function() {
                sweepX = this.targets()[0].x;
            },
            onComplete: function() {
                sweepActive = false;
            }
        });
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

    // Animation loop
    function animate() {
        // Clear canvas
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, width, height);

        // Calculate mouse velocity
        const mouseVelX = mouseX - prevMouseX;
        const mouseVelY = mouseY - prevMouseY;

        // Update and draw dots
        dots.forEach(dot => {
            // Calculate distance from mouse
            const dx = mouseX - dot.x;
            const dy = mouseY - dot.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Calculate distance from sweep line (if active)
            let sweepDistance = Infinity;
            if (sweepActive) {
                sweepDistance = Math.abs(sweepX - dot.x);
            }
            
            // Use the closer of mouse or sweep
            const effectiveDistance = Math.min(distance, sweepDistance);
            const useSweep = sweepActive && sweepDistance < distance;

            if (effectiveDistance < mouseRadius) {
                // Magnetic field effect
                const distanceRatio = 1 - effectiveDistance / mouseRadius;
                const magneticForce = distanceRatio * distanceRatio * pullStrength; // Quadratic falloff
                
                if (useSweep) {
                    // Sweep effect: pull in Y direction with wave pattern
                    const sweepDx = sweepX - dot.x;
                    const sweepDy = 0; // Vertical center
                    const sweepAngle = Math.atan2(sweepDy, sweepDx);
                    
                    // Horizontal pull towards sweep line
                    dot.vx += Math.cos(sweepAngle) * magneticForce * 0.5;
                    
                    // Vertical wave motion
                    const waveOffset = Math.sin(dot.x * 0.02 + Date.now() * 0.003) * 30;
                    const waveDy = waveOffset - (dot.y - dot.originalY);
                    dot.vy += waveDy * magneticForce * 0.3;
                } else {
                    // Normal mouse effect
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

            // Calculate size based on distance from mouse or sweep
            let size = dotRadius;
            if (effectiveDistance < mouseRadius) {
                size = dotRadius + (1 - effectiveDistance / mouseRadius) * 2; // Reduced size increase
            }

            // Calculate opacity based on distance from mouse or sweep
            let opacity = 0.3;
            let color = { r: 255, g: 255, b: 255 }; // Default white
            
            if (effectiveDistance < mouseRadius) {
                opacity = 0.3 + (1 - effectiveDistance / mouseRadius) * 0.7;
                
                // Color based on position
                const hue = (dot.originalX / width) * 360; // Horizontal gradient
                const sat = 70 + (1 - distance / mouseRadius) * 30; // More saturated near mouse
                const light = 50 + (1 - distance / mouseRadius) * 20; // Brighter near mouse
                
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

        // Recreate dots
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

    // Start animation
    animate();
}

// Page transition function
function navigateWithTransition(url, pageName) {
    const transition = document.getElementById('page-transition');
    const transitionText = document.getElementById('transition-text');
    const mainContent = document.querySelector('#main-content');
    
    // Set initial percentage
    transitionText.textContent = '0%';
    
    // Start transition
    transition.classList.add('active');
    
    // Animate percentage from 0 to 100
    gsap.to({ value: 0 }, {
        value: 100,
        duration: 0.8,
        ease: "power2.inOut",
        onUpdate: function() {
            const currentValue = Math.round(this.targets()[0].value);
            transitionText.textContent = currentValue + '%';
        }
    });
    
    // Animate main content out
    gsap.to(mainContent, {
        scale: 0.95,
        opacity: 0.5,
        duration: 0.6,
        ease: "power2.inOut"
    });
    
    // Navigate after transition
    setTimeout(() => {
        window.location.href = url;
    }, 800);
}

// Create dot-based text for menu items
function createDotText() {
    const mainNavItems = document.querySelectorAll('.main-nav .nav-item');
    
    mainNavItems.forEach(item => {
        const text = item.getAttribute('data-text');
        if (!text) return;
        
        // Clear existing content
        item.innerHTML = '';
        
        // Responsive font size based on screen width
        let fontSize = 82;
        const screenWidth = window.innerWidth;
        
        if (screenWidth <= 360) {
            fontSize = 16; // 1.5배 작게 (24 / 1.5 ≈ 16)
        } else if (screenWidth <= 480) {
            fontSize = 24;
        } else if (screenWidth <= 768) {
            fontSize = 32;
        }
        
        const fontWeight = '600';
        const font = 'system-ui, -apple-system, sans-serif';
        
        // Calculate approximate text width
        const textWidth = text.length * fontSize * 0.6; // Rough estimate
        const canvasWidth = Math.ceil(textWidth + 40);
        const canvasHeight = Math.ceil(fontSize * 1.5);
        
        const pixelData = getTextPixelData(text, fontSize, fontWeight, font, canvasWidth, canvasHeight);
        
        // Create dot container
        const dotContainer = document.createElement('div');
        dotContainer.className = 'menu-dot-container';
        dotContainer.style.width = `${canvasWidth}px`;
        dotContainer.style.height = `${canvasHeight}px`;
        item.appendChild(dotContainer);
        
        // Create dots for text
        pixelData.forEach(p => {
            const dot = document.createElement('div');
            dot.className = 'menu-dot';
            dot.style.left = `${p.x}px`;
            dot.style.top = `${p.y}px`;
            dotContainer.appendChild(dot);
        });
    });
}

// Animate menu items from bottom to top
function animateMenuItems() {
    const heroTitles = document.querySelectorAll('.hero-title');
    const heroDescription = document.querySelector('.hero-description');
    const mainNavItems = document.querySelectorAll('.main-nav .nav-item');
    
    // Animate hero titles first
    gsap.to(heroTitles, {
        y: 0,
        opacity: 1,
        duration: 1.2,
        ease: "power3.out",
        stagger: 0.15
    });
    
    // Animate hero description after titles
    if (heroDescription) {
        gsap.to(heroDescription, {
            y: 0,
            opacity: 0.8,
            duration: 1.0,
            ease: "power3.out",
            delay: 0.4
        });
    }
    
    // Set initial state for nav items - hidden below
    gsap.set(mainNavItems, {
        y: 50,
        opacity: 0
    });
    
    // Animate nav items with stagger, delayed after hero titles
    gsap.to(mainNavItems, {
        y: 0,
        opacity: 0.8,
        duration: 0.8,
        ease: "power3.out",
        stagger: 0.1,
        delay: 0.5,
        onComplete: function() {
            // Ensure final opacity is set for all items
            mainNavItems.forEach(item => {
                item.style.opacity = '0.8';
            });
        }
    });
}

// Navigation functionality
function initNavigation() {
    const mainNavItems = document.querySelectorAll('.main-nav .nav-item');
    const headerNavItems = document.querySelectorAll('.header-nav .header-nav-item');
    const headerLogo = document.querySelector('#header-logo');
    
    // Handle main navigation clicks
    mainNavItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const url = item.getAttribute('href');
            const pageName = item.textContent;
            navigateWithTransition(url, pageName);
        });
        
    });
    
    
    // Handle header logo click - reload page to start from beginning
    if (headerLogo) {
        headerLogo.addEventListener('click', () => {
            window.location.href = '/';
        });
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    window.addEventListener('load', () => {
        init();
        initNavigation();
    });
} else {
    init();
    initNavigation();
}

