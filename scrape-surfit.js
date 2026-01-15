// Surfit.io AI 아티클 스크래핑 스크립트
import https from 'https';
import http from 'http';
import fs from 'fs';

const url = 'https://www.surfit.io/explore/startup/ai';
// API 엔드포인트 시도 (실제 엔드포인트는 브라우저 개발자 도구에서 확인 필요)
const apiUrls = [
  'https://api.surfit.io/explore/startup/ai',
  'https://www.surfit.io/api/explore/startup/ai',
  'https://api.surfit.io/v1/articles?category=ai&type=startup',
  'https://content.surfit.io/explore/startup/ai'
];

// User-Agent 헤더 추가
const options = {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7'
  }
};

// HTML 가져오기
function fetchHTML(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    protocol.get(url, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve(data);
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

// 간단한 HTML 파싱 (cheerio 없이)
function extractArticles(html) {
  const articles = [];
  
  // 아티클 카드 패턴 찾기 (일반적인 패턴)
  // 실제 사이트 구조에 맞게 수정 필요
  const articlePatterns = [
    /<article[^>]*>[\s\S]*?<\/article>/gi,
    /<div[^>]*class="[^"]*article[^"]*"[^>]*>[\s\S]*?<\/div>/gi,
    /<div[^>]*class="[^"]*card[^"]*"[^>]*>[\s\S]*?<\/div>/gi,
    /<a[^>]*href="([^"]*)"[^>]*>[\s\S]*?<\/a>/gi
  ];
  
  // 제목 추출
  const titlePattern = /<h[1-6][^>]*>([^<]+)<\/h[1-6]>/gi;
  const titles = [];
  let match;
  while ((match = titlePattern.exec(html)) !== null) {
    titles.push(match[1].trim());
  }
  
  // 링크 추출
  const linkPattern = /<a[^>]*href="([^"]*)"[^>]*>[\s\S]*?<\/a>/gi;
  const links = [];
  while ((match = linkPattern.exec(html)) !== null) {
    const href = match[1];
    if (href && (href.includes('/article/') || href.includes('/post/') || href.includes('/news/'))) {
      links.push(href.startsWith('http') ? href : `https://www.surfit.io${href}`);
    }
  }
  
  // 설명 추출
  const descPattern = /<p[^>]*>([^<]+)<\/p>/gi;
  const descriptions = [];
  while ((match = descPattern.exec(html)) !== null) {
    const desc = match[1].trim();
    if (desc.length > 20 && desc.length < 200) {
      descriptions.push(desc);
    }
  }
  
  // 이미지 추출
  const imgPattern = /<img[^>]*src="([^"]*)"[^>]*>/gi;
  const images = [];
  while ((match = imgPattern.exec(html)) !== null) {
    const src = match[1];
    if (src && !src.includes('logo') && !src.includes('icon')) {
      images.push(src.startsWith('http') ? src : `https://www.surfit.io${src}`);
    }
  }
  
  // 데이터 조합 (최대 30개)
  const maxItems = Math.min(30, Math.max(titles.length, links.length));
  for (let i = 0; i < maxItems; i++) {
    if (links[i]) {
      articles.push({
        title: titles[i] || `AI Article ${i + 1}`,
        url: links[i],
        description: descriptions[i] || 'AI 관련 아티클',
        image: images[i] || '',
        author: 'Surfit',
        date: new Date().toLocaleDateString('ko-KR')
      });
    }
  }
  
  return articles;
}

// 더 정교한 파싱을 위한 cheerio 사용 (설치된 경우)
async function extractArticlesWithCheerio(html) {
  try {
    // 동적 import 시도
    const cheerio = await import('cheerio');
    const $ = cheerio.load(html);
    const articles = [];
    
    // Surfit.io의 실제 구조에 맞게 선택자 수정 필요
    $('article, .article-card, .post-card, [class*="article"], [class*="card"]').each((i, elem) => {
      if (i >= 30) return false; // 최대 30개
      
      const $elem = $(elem);
      const title = $elem.find('h1, h2, h3, h4, .title, [class*="title"]').first().text().trim();
      const link = $elem.find('a').first().attr('href') || '';
      const description = $elem.find('p, .description, [class*="desc"]').first().text().trim();
      const image = $elem.find('img').first().attr('src') || '';
      
      if (title && link) {
        articles.push({
          title: title,
          url: link.startsWith('http') ? link : `https://www.surfit.io${link}`,
          description: description || 'AI 관련 아티클',
          image: image.startsWith('http') ? image : (image ? `https://www.surfit.io${image}` : ''),
          author: $elem.find('.author, [class*="author"]').text().trim() || 'Surfit',
          date: $elem.find('.date, [class*="date"]').text().trim() || new Date().toLocaleDateString('ko-KR')
        });
      }
    });
    
    return articles;
  } catch (err) {
    console.log('Cheerio를 사용할 수 없습니다. 기본 파싱을 사용합니다.');
    return extractArticles(html);
  }
}

// HTML 생성
function generateArticlesPage(articles) {
  const html = `<!doctype html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <link rel="icon" type="image/svg+xml" href="/vite.svg" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>WYND23 - AI Articles</title>
  <link rel="stylesheet" href="/page-style.css" />
  <style>
    .work-page {
      max-width: 1200px;
      margin: 0 auto;
      width: 100%;
      padding: 200px 40px 80px;
    }

    .work-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 40px;
      margin-top: 60px;
    }

    .work-item {
      background: #fff;
      border-radius: 12px;
      overflow: hidden;
      cursor: pointer;
      transition: all 0.3s ease;
      opacity: 0;
      transform: translateY(30px);
      animation: fadeInUp 0.6s ease forwards;
      text-decoration: none;
      display: block;
      color: inherit;
      border: 1px solid rgba(0, 0, 0, 0.1);
    }

    .work-item:nth-child(1) { animation-delay: 0.1s; }
    .work-item:nth-child(2) { animation-delay: 0.15s; }
    .work-item:nth-child(3) { animation-delay: 0.2s; }
    .work-item:nth-child(4) { animation-delay: 0.25s; }
    .work-item:nth-child(5) { animation-delay: 0.3s; }
    .work-item:nth-child(6) { animation-delay: 0.35s; }
    .work-item:nth-child(7) { animation-delay: 0.4s; }
    .work-item:nth-child(8) { animation-delay: 0.45s; }
    .work-item:nth-child(9) { animation-delay: 0.5s; }
    .work-item:nth-child(10) { animation-delay: 0.55s; }
    .work-item:nth-child(11) { animation-delay: 0.6s; }
    .work-item:nth-child(12) { animation-delay: 0.65s; }

    .work-item:hover {
      transform: translateY(-8px);
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
      border-color: rgba(0, 0, 0, 0.2);
    }

    .work-thumbnail {
      width: 100%;
      height: 200px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      position: relative;
      overflow: hidden;
    }

    .work-thumbnail img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .work-info {
      padding: 24px;
    }

    .work-type {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #666;
      margin-bottom: 8px;
    }

    .work-name {
      font-size: 20px;
      font-weight: 700;
      color: #000;
      margin-bottom: 12px;
      letter-spacing: 0.5px;
      line-height: 1.4;
    }

    .work-description {
      font-size: 14px;
      color: #666;
      line-height: 1.6;
      margin-bottom: 12px;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .work-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 12px;
      color: #999;
      padding-top: 12px;
      border-top: 1px solid rgba(0, 0, 0, 0.1);
    }

    .work-author {
      font-weight: 500;
    }

    .work-date {
      color: #999;
    }

    @keyframes fadeInUp {
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @media (max-width: 768px) {
      .work-page {
        padding: 200px 24px 60px;
      }

      .work-grid {
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 30px;
      }
    }
  </style>
</head>
<body class="white-page work-page">
  <canvas id="page-canvas"></canvas>
  
  <!-- Fixed Header -->
  <header id="fixed-header" class="fixed-header visible">
    <div class="header-logo" id="header-logo">WYND23</div>
    <nav class="header-nav">
      <a href="work.html" class="header-nav-item active">WORK</a>
      <a href="about.html" class="header-nav-item">ABOUT</a>
      <a href="contact.html" class="header-nav-item">CONTACT</a>
    </nav>
  </header>

  <div class="page-container white-theme">
    <div class="work-page">
      <div class="work-hero">
        <h1 class="work-main-title">AI Articles</h1>
        <p class="work-subtitle">Surfit.io에서 수집한 AI 관련 아티클을 살펴보세요.</p>
      </div>

      <div class="work-grid">
        ${articles.map((article, index) => `
          <a href="${article.url}" target="_blank" rel="noopener noreferrer" class="work-item" data-index="${index}">
            ${article.image ? `
            <div class="work-thumbnail">
              <img src="${article.image}" alt="${article.title}" onerror="this.parentElement.style.background='linear-gradient(135deg, #667eea 0%, #764ba2 100%)'" />
            </div>
            ` : ''}
            <div class="work-info">
              <div class="work-type">Article</div>
              <h3 class="work-name">${article.title}</h3>
              <p class="work-description">${article.description}</p>
              <div class="work-meta">
                <span class="work-author">by ${article.author}</span>
                <span class="work-date">${article.date}</span>
              </div>
            </div>
          </a>
        `).join('')}
      </div>
    </div>
  </div>

  <script type="module" src="/page-script.js"></script>
</body>
</html>`;

  return html;
}

// API에서 JSON 데이터 가져오기
async function fetchAPI(apiUrl) {
  return new Promise((resolve, reject) => {
    const protocol = apiUrl.startsWith('https') ? https : http;
    
    protocol.get(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
        'Referer': 'https://www.surfit.io/'
      }
    }, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json);
        } catch (e) {
          reject(new Error('Invalid JSON'));
        }
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

// 메인 실행
async function main() {
  let articles = [];
  
  // 먼저 API 엔드포인트 시도
  console.log('📡 Surfit.io API에서 데이터를 가져오는 중...');
  for (const apiUrl of apiUrls) {
    try {
      console.log(`  시도 중: ${apiUrl}`);
      const data = await fetchAPI(apiUrl);
      console.log(`✅ API 응답 수신:`, Object.keys(data));
      
      // API 응답 구조에 맞게 파싱 (실제 구조에 맞게 수정 필요)
      if (data.articles || data.data || data.items) {
        const items = data.articles || data.data || data.items;
        articles = items.map(item => ({
          title: item.title || item.name || '제목 없음',
          url: item.url || item.link || `https://www.surfit.io${item.path || ''}`,
          description: item.description || item.summary || item.excerpt || '',
          image: item.image || item.thumbnail || item.cover || '',
          author: item.author || item.writer || 'Surfit',
          date: item.date || item.publishedAt || item.createdAt || new Date().toLocaleDateString('ko-KR')
        }));
        break;
      }
    } catch (error) {
      console.log(`  ❌ ${apiUrl} 실패: ${error.message}`);
      continue;
    }
  }
  
  // API 실패 시 HTML 파싱 시도
  if (articles.length === 0) {
    try {
      console.log('📡 HTML에서 데이터를 가져오는 중...');
      const html = await fetchHTML(url);
      console.log(`✅ HTML 수신 완료 (${html.length} bytes)`);
      
      // 디버깅: HTML 저장
      fs.writeFileSync('surfit-raw.html', html);
      console.log('💾 원본 HTML을 surfit-raw.html에 저장했습니다.');
      
      console.log('🔍 아티클 추출 중...');
      let extracted = await extractArticlesWithCheerio(html);
      
      if (extracted.length === 0) {
        console.log('⚠️  Cheerio로 추출 실패, 기본 파싱 사용...');
        extracted = extractArticles(html);
      }
      
      articles = extracted;
    } catch (error) {
      console.error('❌ HTML 파싱 오류:', error.message);
    }
  }
  
  // 여전히 없으면 샘플 데이터 사용
  if (articles.length === 0) {
    console.log('⚠️  아티클을 찾을 수 없습니다. 샘플 데이터를 사용합니다.');
    console.log('💡 팁: 브라우저 개발자 도구(F12) > Network 탭에서 실제 API 엔드포인트를 확인하세요.');
    articles = getSampleArticles();
  }
  
  console.log(`✅ ${articles.length}개의 아티클 추출 완료`);
  
  const outputHtml = generateArticlesPage(articles);
  fs.writeFileSync('ai-articles.html', outputHtml);
  console.log(`✅ ai-articles.html 생성 완료! ${articles.length}개의 아티클이 포함되었습니다.`);
}

// 샘플 데이터
function getSampleArticles() {
  return [
    {
      title: 'AI가 바꾸는 스타트업의 미래',
      url: 'https://www.surfit.io/explore/startup/ai',
      description: '인공지능 기술이 스타트업 생태계에 미치는 영향과 기회에 대해 살펴봅니다.',
      image: '',
      author: 'Surfit',
      date: '2024.01.15'
    },
    {
      title: 'ChatGPT와 생성형 AI의 혁명',
      url: 'https://www.surfit.io/explore/startup/ai',
      description: '생성형 AI 기술의 발전과 비즈니스 적용 사례를 분석합니다.',
      image: '',
      author: 'Surfit',
      date: '2024.01.14'
    },
    {
      title: 'AI 스타트업 투자 트렌드 2024',
      url: 'https://www.surfit.io/explore/startup/ai',
      description: '2024년 AI 스타트업 투자 동향과 주요 투자처를 정리했습니다.',
      image: '',
      author: 'Surfit',
      date: '2024.01.13'
    }
  ];
}

main();
