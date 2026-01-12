import './style.css'
import gsap from 'gsap'

const container = document.querySelector('#app');
let hasNavigated = false;

function goToMain() {
    if (hasNavigated) return;
    hasNavigated = true;
    window.location.replace('/main.html');
}

function init() {
    if (!container) return;
    
    container.innerHTML = '';
    
    // Hide main content initially
    const mainContent = document.querySelector('#main-content');
    if (mainContent) {
        gsap.set(mainContent, {
            y: window.innerHeight,
            opacity: 0,
            visibility: 'hidden'
        });
    }
    
    // Create HPN text wrapper
    const wordWrapper = document.createElement('div');
    wordWrapper.className = 'word-wrapper';
    container.appendChild(wordWrapper);
    
    const text = 'HPN';
    const letters = [];
    
    // Create letters
    text.split('').forEach((char, index) => {
        const span = document.createElement('span');
        span.className = 'letter';
        span.textContent = char;
        wordWrapper.appendChild(span);
        letters.push(span);
    });
    
    // Total animation duration
    const totalDuration = 2.2;
    
    // Calculate final Y position - centered
    const finalY = 0; // Centered position
    
    let completedLetters = 0;
    
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
                    scrollToMain(letters);
                }
            }
        });
    });
    
    // Click to skip
    container.addEventListener('click', () => {
        scrollToMain(letters);
    });
    container.addEventListener('wheel', () => {
        scrollToMain(letters);
    });
}

function scrollToMain(letters) {
    if (hasNavigated) return;
    hasNavigated = true;
    
    // Get main content element
    const mainContent = document.querySelector('#main-content');
    if (!mainContent) {
        // Fallback: navigate to main page
        window.location.replace('/main.html');
        return;
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
            duration: 1.5,
            ease: "power2.inOut"
        });
    });
    
    // Animate container (loading page) moving up
    gsap.to(container, {
        y: -window.innerHeight,
        opacity: 0,
        duration: 1.5,
        ease: "power2.inOut"
    });
    
    // Animate main content scrolling up from below - gradually appearing
    gsap.to(mainContent, {
        y: 0,
        opacity: 1,
        duration: 1.5,
        ease: "power2.inOut",
        delay: 0.3 // Slight delay for smoother transition
    });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    window.addEventListener('load', init);
} else {
    init();
}
