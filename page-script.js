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

    // Dot grid settings
    const dotSpacing = 25;
    const dotRadius = 1.5;
    const mouseRadius = 120;
    const pullStrength = 0.15;

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
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    canvas.addEventListener('mouseleave', () => {
        mouseX = -1000;
        mouseY = -1000;
    });

    // Animation loop
    function animate() {
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, width, height);

        dots.forEach(dot => {
            const dx = mouseX - dot.x;
            const dy = mouseY - dot.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < mouseRadius) {
                const force = (1 - distance / mouseRadius) * pullStrength;
                dot.vx += dx * force * 0.05;
                dot.vy += dy * force * 0.05;
            }

            dot.x += dot.vx;
            dot.y += dot.vy;
            dot.vx *= 0.8;
            dot.vy *= 0.8;

            const returnForce = 0.08;
            dot.x += (dot.originalX - dot.x) * returnForce;
            dot.y += (dot.originalY - dot.y) * returnForce;

            let size = dotRadius;
            if (distance < mouseRadius) {
                size = dotRadius + (1 - distance / mouseRadius) * 2;
            }

            let opacity = 0.3;
            let color = { r: 255, g: 255, b: 255 }; // Default white
            
            if (distance < mouseRadius) {
                opacity = 0.3 + (1 - distance / mouseRadius) * 0.7;
                
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
    // Add loading class initially
    document.body.classList.add('loading');
    
    // Remove loading class after a short delay to trigger animation
    setTimeout(() => {
        document.body.classList.remove('loading');
    }, 100);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initPageLoadAnimation();
        initPageDotAnimation();
    });
} else {
    initPageLoadAnimation();
    initPageDotAnimation();
}
