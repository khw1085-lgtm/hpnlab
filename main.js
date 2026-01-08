import './style.css'
import gsap from 'gsap'

console.log('=== Loading Screen Started ===');

const container = document.querySelector('#app');

if (!container) {
    console.error('ERROR: #app container not found!');
    document.body.innerHTML = '<h1 style="color: red;">ERROR: Container not found</h1>';
} else {
    console.log('Container found, initializing...');
}

const init = () => {
    console.log('Init function called');
    
    if (!container) {
        console.error('Container is null in init');
        return;
    }

    container.innerHTML = '';

    // Create text wrapper
    const wordWrapper = document.createElement('div');
    wordWrapper.classList.add('word-wrapper');
    container.appendChild(wordWrapper);

    const text = "KHW";
    console.log('Creating letters for:', text);

    // Create letters
    const letters = [];
    text.split('').forEach((char, index) => {
        const span = document.createElement('span');
        span.classList.add('letter');
        span.textContent = char;
        wordWrapper.appendChild(span);
        letters.push(span);
        console.log(`Created letter ${index}: ${char}`);
    });

    // Create loading bar
    const lbWrapper = document.createElement('div');
    lbWrapper.classList.add('loading-bar-wrapper');
    const lbFill = document.createElement('div');
    lbFill.classList.add('loading-bar-fill');
    lbWrapper.appendChild(lbFill);
    container.appendChild(lbWrapper);
    console.log('Loading bar created');

    // Create light sweep
    const sweep = document.createElement('div');
    sweep.classList.add('light-sweep');
    container.appendChild(sweep);

    // Custom cursor
    if (!document.querySelector('.cursor-emoji')) {
        const cursor = document.createElement('div');
        cursor.classList.add('cursor-emoji');
        cursor.textContent = '👋';
        document.body.appendChild(cursor);

        window.addEventListener('mousemove', (e) => {
            gsap.to(cursor, {
                x: e.clientX,
                y: e.clientY,
                duration: 0.1,
                ease: "power1.out"
            });
        });
    }

    // Animation timeline
    const tl = gsap.timeline();

    // Letter animation
    tl.fromTo('.letter',
        {
            y: -window.innerHeight,
            x: "random(-300, 300)",
            opacity: 0,
            rotation: "random(-360, 360)",
            scale: 0.8
        },
        {
            y: 0,
            x: 0,
            opacity: 1,
            rotation: 0,
            scale: 1,
            duration: 2.5,
            ease: "power3.out",
            stagger: 0.1
        }
    );

    // Bar appearance
    tl.fromTo(lbWrapper,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 1 },
        "-=1"
    );

    // Light sweep
    tl.fromTo(sweep,
        { x: '-100%' },
        { x: '50%', duration: 1.5, ease: "power2.inOut" },
        "-=0.5"
    );

    // Loading bar fill - 2 seconds
    const barStartTime = tl.duration();
    console.log('Bar start time:', barStartTime);
    
    gsap.to(lbFill, {
        width: "100%",
        duration: 2,
        ease: "linear",
        delay: barStartTime,
        onStart: () => console.log('Loading bar started filling'),
        onComplete: () => {
            console.log('Loading bar complete, navigating...');
            navigateToMain();
        }
    });

    // Fallback navigation
    const totalTime = (barStartTime + 2) * 1000;
    console.log('Fallback timer set for:', totalTime, 'ms');
    setTimeout(() => {
        console.log('Fallback timer triggered');
        navigateToMain();
    }, totalTime);
};

const navigateToMain = () => {
    console.log('=== Navigating to main page ===');
    const currentPath = window.location.pathname;
    console.log('Current path:', currentPath);
    
    if (currentPath === '/' || currentPath === '/index.html') {
        console.log('Redirecting to /main.html');
        window.location.href = '/main.html';
    } else {
        console.log('Already on different page, not redirecting');
    }
};

// Starlight effect
const starlight = (element) => {
    if (gsap.isTweening(element) && element.style.transform.includes('scale(0.8)')) return;

    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    gsap.to(element, {
        scale: 0.8,
        filter: "blur(2px)",
        color: "#ccc",
        duration: 0.2,
        ease: "power2.out",
        onComplete: () => {
            gsap.to(element, {
                scale: 1,
                filter: "blur(0px)",
                color: "#fff",
                duration: 1,
                ease: "elastic.out(1, 0.5)"
            });
        }
    });

    const particleCount = 8;
    for (let i = 0; i < particleCount; i++) {
        const p = document.createElement('div');
        p.classList.add('particle');
        document.body.appendChild(p);

        gsap.set(p, {
            x: centerX,
            y: centerY,
            scale: "random(0.5, 1.2)",
            opacity: 1
        });

        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * 25 + 10;

        gsap.to(p, {
            x: centerX + Math.cos(angle) * dist,
            y: centerY + Math.sin(angle) * dist,
            opacity: 0,
            scale: 0,
            duration: "random(0.4, 0.8)",
            ease: "power2.out",
            onComplete: () => p.remove()
        });
    }
};

// Add hover effects to letters after they're created
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        document.querySelectorAll('.letter').forEach(letter => {
            letter.addEventListener('mouseenter', () => starlight(letter));
        });
    }, 3000);
});

// Exit handlers
let isExiting = false;
const exitAnimation = () => {
    if (isExiting) return;
    isExiting = true;
    console.log('Exit animation triggered');
    navigateToMain();
};

if (container) {
    container.addEventListener('click', exitAnimation);
    container.addEventListener('wheel', exitAnimation);
}

// Initialize
if (document.readyState === 'loading') {
    window.addEventListener('load', () => {
        console.log('Window loaded, calling init');
        init();
    });
} else {
    console.log('Document already loaded, calling init immediately');
    init();
}
