import './style.css'
import gsap from 'gsap'

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

// Initialize - removed loading page
function initMainPage() {
    // Show header immediately
    const header = document.getElementById('fixed-header');
    if (header) {
        header.classList.add('visible');
    }
    
    // Show main content immediately
    const mainContent = document.querySelector('#main-content');
    if (mainContent) {
        gsap.set(mainContent, {
            opacity: 1,
            visibility: 'visible'
        });
        
        // Animate hero text
        animateHeroText();
    }
}

// Removed loading page functions - main page shows immediately

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
    let height = 600; // Fixed height for main content area
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

    // Create dot grid (only for 600px height)
    const dots = [];
    const maxHeight = 600; // Limit to 600px
    for (let x = 0; x < width; x += dotSpacing) {
        for (let y = 0; y < maxHeight; y += dotSpacing) {
            dots.push({
                x: x,
                y: y + maxHeight, // Start below viewport
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
        }
    });

    // Animation loop
    function animate() {
        // Clear canvas
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, width, height);

        // Calculate mouse velocity
        const mouseVelX = mouseX - prevMouseX;
        const mouseVelY = mouseY - prevMouseY;

        // Update and draw dots (no magnetic effect)
        dots.forEach(dot => {
            // Only draw dots within 600px height
            if (dot.y > 600) {
                return;
            }
            
            // Reset dot to original position (no movement)
            dot.x = dot.originalX;
            dot.y = dot.originalY;
            
            // Fixed size and opacity
            const size = dotRadius;
            const opacity = 0.3;
            
            // Color based on horizontal position (gradient effect)
            const hue = (dot.originalX / width) * 360;
            const sat = 70;
            const light = 50;
            
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
        height = 600; // Fixed height for main content area
        canvas.width = width;
        canvas.height = height;

        // Recreate dots (only for 600px height)
        const maxHeight = 600;
        dots.length = 0;
        for (let x = 0; x < width; x += dotSpacing) {
            for (let y = 0; y < maxHeight; y += dotSpacing) {
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

// Animate hero text
function animateHeroText() {
    const heroTitles = document.querySelectorAll('.hero-title');
    const heroDescription = document.querySelector('.hero-description');
    const categoryTabs = document.querySelector('.category-tabs');
    
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
            opacity: 1,
            duration: 1.0,
            ease: "power3.out",
            delay: 0.4
        });
    }
    
    // Animate category tabs
    if (categoryTabs) {
        gsap.to(categoryTabs, {
            y: 0,
            opacity: 1,
            duration: 0.8,
            ease: "power3.out",
            delay: 0.6
        });
    }
}

// Load AI articles
let aiArticles = [];
let allArticles = [];

// Default articles (non-AI)
const defaultArticles = [
    {
        title: '미니멀리즘과 브루탈리즘의 조화',
        description: '현대 웹 디자인 트렌드에서 두 가지 상반된 스타일이 어떻게 융합되는지 살펴봅니다.',
        date: '2026.01.13',
        author: 'design',
        category: 'ui'
    },
    {
        title: '브랜드 스토리텔링의 디지털 전환',
        description: '디지털 시대에 브랜드가 고객과 소통하는 방식의 변화와 새로운 마케팅 전략을 분석합니다.',
        date: '2026.01.12',
        author: 'marketing',
        category: 'brand-marketing'
    },
    {
        title: '사용자 경험을 향상시키는 인터랙션 디자인',
        description: '직관적이고 매력적인 UI 인터랙션을 만드는 디자인 원칙과 최신 트렌드를 소개합니다.',
        date: '2026.01.10',
        author: 'ui',
        category: 'ui'
    },
    {
        title: '데이터 기반 UX 디자인 방법론',
        description: '사용자 데이터를 분석하여 더 나은 사용자 경험을 설계하는 실전 가이드입니다.',
        date: '2026.01.09',
        author: 'ux',
        category: 'ux'
    },
    {
        title: '디지털 브랜드 아이덴티티 구축 전략',
        description: '온라인에서 브랜드를 차별화하고 강력한 아이덴티티를 만드는 디자인 접근법을 다룹니다.',
        date: '2026.01.08',
        author: 'brand',
        category: 'brand-design'
    }
];

async function loadAIArticles() {
    try {
        const response = await fetch('/ai-articles.json');
        if (response.ok) {
            aiArticles = await response.json();
            console.log(`✅ ${aiArticles.length}개의 AI 아티클 로드 완료`);
        } else {
            console.log('⚠️ AI 아티클 파일을 찾을 수 없습니다.');
            aiArticles = [];
        }
    } catch (error) {
        console.log('⚠️ AI 아티클 로드 실패:', error.message);
        aiArticles = [];
    }
    
    // Combine all articles
    allArticles = [...defaultArticles, ...aiArticles];
}

// Render content cards
function renderContentCards(articles) {
    const grid = document.getElementById('content-grid');
    if (!grid) return;
    
    if (articles.length === 0) {
        grid.innerHTML = '<div class="no-content">콘텐츠가 없습니다.</div>';
        return;
    }
    
    grid.innerHTML = articles.map(article => {
        // URL 검증: 메인 페이지 URL이면 제외
        let url = article.url || '#';
        if (url === 'https://the-edit.co.kr/' || url === 'https://the-edit.co.kr' || !url.match(/\/\d+$/)) {
            console.warn(`⚠️ 유효하지 않은 URL 발견: "${article.title}" (${url})`);
            url = '#'; // 유효하지 않은 URL은 링크 비활성화
        }
        const thumbnail = article.thumbnail || '';
        
        return `
        <a href="${url}" ${url === '#' ? 'onclick="return false;"' : 'target="_blank" rel="noopener noreferrer"'} class="content-card" data-category="${article.category || 'all'}">
            <div class="card-thumbnail">
                ${thumbnail 
                    ? `<img src="${thumbnail}" alt="${article.title || ''}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />`
                    : ''
                }
                <div class="thumbnail-placeholder" style="${thumbnail ? 'display: none;' : ''}"></div>
            </div>
            <div class="card-info">
                <div class="card-meta">${article.author || 'the-edit'} | ${article.date || ''}</div>
                <h3 class="card-title">${article.title || ''}</h3>
                <p class="card-description">${article.description || ''}</p>
            </div>
        </a>
        `;
    }).join('');
}

// Initialize category tabs
function initCategoryTabs() {
    const categoryButtons = document.querySelectorAll('.category-btn');
    
    // Load articles first
    loadAIArticles().then(() => {
        // Initial render with all articles
        renderContentCards(allArticles);
    });
    
    categoryButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Remove active class from all buttons
            categoryButtons.forEach(b => b.classList.remove('active'));
            
            // Add active class to clicked button
            btn.classList.add('active');
            
            // Get category
            const category = btn.getAttribute('data-category');
            console.log('Selected category:', category);
            
            // Filter and render content
            let articlesToShow = [];
            if (category === 'ai') {
                // Show only AI articles
                articlesToShow = aiArticles;
            } else if (category === 'all') {
                // Show all articles
                articlesToShow = allArticles;
            } else {
                // Filter by category
                articlesToShow = allArticles.filter(article => {
                    const articleCategory = article.category || 'all';
                    return articleCategory === category;
                });
            }
            
            // Render cards
            renderContentCards(articlesToShow);
            
            // Scroll to category tabs with smooth animation
            const categoryTabs = document.getElementById('category-tabs');
            if (categoryTabs) {
                const headerHeight = 60;
                const targetPosition = categoryTabs.offsetTop - headerHeight - 20;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Search functionality
function initSearch() {
    const searchInput = document.querySelector('.search-input');
    if (!searchInput) return;
    
    let searchTimeout;
    
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.trim().toLowerCase();
        
        // Debounce search
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            if (searchTerm === '') {
                // If search is empty, show all articles
                renderContentCards(allArticles);
                // Reset category buttons
                const categoryButtons = document.querySelectorAll('.category-btn');
                categoryButtons.forEach(btn => {
                    if (btn.getAttribute('data-category') === 'all') {
                        btn.classList.add('active');
                    } else {
                        btn.classList.remove('active');
                    }
                });
            } else {
                // Filter articles by search term
                const filteredArticles = allArticles.filter(article => {
                    const title = (article.title || '').toLowerCase();
                    const description = (article.description || '').toLowerCase();
                    const author = (article.author || '').toLowerCase();
                    const category = (article.category || '').toLowerCase();
                    
                    return title.includes(searchTerm) || 
                           description.includes(searchTerm) || 
                           author.includes(searchTerm) ||
                           category.includes(searchTerm);
                });
                
                renderContentCards(filteredArticles);
                
                // Remove active class from all category buttons when searching
                const categoryButtons = document.querySelectorAll('.category-btn');
                categoryButtons.forEach(btn => btn.classList.remove('active'));
            }
            
            // Scroll to content grid
            const contentGrid = document.getElementById('content-grid');
            if (contentGrid) {
                const headerHeight = 60;
                const targetPosition = contentGrid.offsetTop - headerHeight - 20;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        }, 300); // 300ms debounce
    });
}

// Navigation functionality
function initNavigation() {
    const headerNavItems = document.querySelectorAll('.header-nav .header-nav-item');
    const headerLogo = document.querySelector('#header-logo');
    
    // Handle header navigation clicks
    headerNavItems.forEach(item => {
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

// Initialize main page immediately - removed duplicate

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    window.addEventListener('load', () => {
        initMainPage();
        initNavigation();
        initCategoryTabs();
        initSearch();
    });
} else {
    initMainPage();
    initNavigation();
    initCategoryTabs();
    initSearch();
}

