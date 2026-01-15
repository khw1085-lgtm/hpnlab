// The Edit 사이트에서 AI 관련 아티클 자동 스크래핑
import https from 'https';
import http from 'http';
import fs from 'fs';

const baseUrl = 'https://the-edit.co.kr/';
const aiKeywords = ['AI', 'ai', '인공지능', '머신러닝', '딥러닝', 'ChatGPT', 'GPT', '로봇', '자동화', '생성형', '제미나이', 'Gemini'];

// HTML 가져오기
function fetchHTML(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    protocol.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7'
      }
    }, (res) => {
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

// HTML에서 AI 관련 아티클 추출
function extractAIArticles(html) {
  const articles = [];
  const seenUrls = new Set();
  
  // 아티클 링크 패턴 찾기: <a href="https://the-edit.co.kr/숫자">제목</a>
  const linkPattern = /<a[^>]*href="(https:\/\/the-edit\.co\.kr\/\d+)"[^>]*>[\s\S]*?<\/a>/gi;
  const imagePattern = /<a[^>]*class="image"[^>]*href="(https:\/\/the-edit\.co\.kr\/\d+)"[^>]*>[\s\S]*?<img[^>]*data-lazy-src="([^"]+)"[^>]*>/gi;
  
  // 이미지와 URL 매핑
  const imageMap = new Map();
  let match;
  while ((match = imagePattern.exec(html)) !== null) {
    const url = match[1];
    const imageUrl = match[2].replace(/^data:image\/svg\+xml[^,]+,\s*/, '');
    if (imageUrl && !imageUrl.startsWith('data:')) {
      imageMap.set(url, imageUrl);
    }
  }
  
  // 링크와 제목 추출
  const linkTitlePattern = /<a[^>]*href="(https:\/\/the-edit\.co\.kr\/\d+)"[^>]*>([^<]+)<\/a>/gi;
  while ((match = linkTitlePattern.exec(html)) !== null) {
    const url = match[1];
    const title = match[2].trim();
    
    // AI 키워드가 포함된 제목만 필터링
    const hasAIKeyword = aiKeywords.some(keyword => 
      title.includes(keyword) || title.toLowerCase().includes(keyword.toLowerCase())
    );
    
    if (hasAIKeyword && !seenUrls.has(url)) {
      seenUrls.add(url);
      
      // 날짜 추출 (제목 근처에서 찾기)
      const datePattern = /(\d{4}\.\s*\d{1,2}\.\s*\d{1,2})/;
      const dateMatch = html.substring(Math.max(0, match.index - 500), match.index + 500).match(datePattern);
      const date = dateMatch ? dateMatch[1].replace(/\s/g, '') : '';
      
      // 작성자 추출
      const authorPattern = /<p[^>]*class="[^"]*author[^"]*"[^>]*>([^<]+)<\/p>/i;
      const authorMatch = html.substring(Math.max(0, match.index - 1000), match.index + 1000).match(authorPattern);
      const author = authorMatch ? authorMatch[1].trim() : '디에디트';
      
      // 설명 추출 (제목 다음에 오는 텍스트)
      const descPattern = new RegExp(`<a[^>]*href="${url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]*>[^<]+<\/a>\\s*<p[^>]*>([^<]+)<\/p>`, 'i');
      const descMatch = html.substring(match.index, match.index + 1000).match(descPattern);
      const description = descMatch ? descMatch[1].trim() : '';
      
      // 이미지 URL 찾기
      const thumbnail = imageMap.get(url) || '';
      
      articles.push({
        title: title,
        description: description || title,
        date: date || new Date().toISOString().split('T')[0].replace(/-/g, '.'),
        author: author,
        category: 'TECH',
        url: url,
        thumbnail: thumbnail
      });
    }
  }
  
  // 기존 아티클과 병합 (중복 제거)
  let existingArticles = [];
  try {
    if (fs.existsSync('public/ai-articles.json')) {
      existingArticles = JSON.parse(fs.readFileSync('public/ai-articles.json', 'utf8'));
    }
  } catch (e) {
    console.log('기존 파일 읽기 실패, 새로 생성합니다.');
  }
  
  // 기존 아티클의 URL을 Set으로 변환
  const existingUrls = new Set(existingArticles.map(a => a.url));
  
  // 새로운 아티클만 추가
  const newArticles = articles.filter(a => !existingUrls.has(a.url));
  
  // 기존 아티클 중 메인 페이지 URL을 가진 것들을 새로 찾은 아티클로 업데이트
  const updatedExistingArticles = existingArticles.map(existing => {
    // 메인 페이지 URL이면 새로 찾은 아티클 중 같은 제목을 가진 것으로 교체
    if (existing.url === 'https://the-edit.co.kr/' || existing.url === baseUrl) {
      const found = articles.find(a => a.title === existing.title);
      if (found && found.url !== baseUrl && found.url !== 'https://the-edit.co.kr/') {
        console.log(`✅ 기존 아티클 URL 업데이트: "${existing.title}" -> ${found.url}`);
        return found;
      }
    }
    // URL이 유효한지 확인 (숫자로 끝나는지)
    if (!existing.url.match(/\/\d+$/)) {
      const found = articles.find(a => a.title === existing.title);
      if (found && found.url.match(/\/\d+$/)) {
        console.log(`✅ 기존 아티클 URL 업데이트: "${existing.title}" -> ${found.url}`);
        return found;
      }
    }
    return existing;
  });
  
  // 모든 아티클을 날짜순으로 정렬 (최신순)
  const allArticles = [...updatedExistingArticles, ...newArticles];
  
  // 중복 제거 (URL 기준)
  const uniqueArticles = [];
  const seenUrlsSet = new Set();
  for (const article of allArticles) {
    // 메인 페이지 URL은 제외
    if (article.url === baseUrl || article.url === 'https://the-edit.co.kr/') {
      console.log(`⚠️ 메인 페이지 URL 제외: "${article.title}"`);
      continue;
    }
    // 유효한 URL인지 확인 (숫자로 끝나야 함)
    if (!article.url.match(/\/\d+$/)) {
      console.log(`⚠️ 유효하지 않은 URL 제외: "${article.title}" (${article.url})`);
      continue;
    }
    if (!seenUrlsSet.has(article.url)) {
      seenUrlsSet.add(article.url);
      uniqueArticles.push(article);
    }
  }
  
  uniqueArticles.sort((a, b) => {
    const dateA = new Date(a.date.replace(/\./g, '-'));
    const dateB = new Date(b.date.replace(/\./g, '-'));
    return dateB - dateA;
  });
  
  return uniqueArticles;
}

// 메인 실행
async function main() {
  try {
    console.log('📡 The Edit 사이트에서 AI 아티클을 가져오는 중...');
    const html = await fetchHTML(baseUrl);
    console.log(`✅ HTML 수신 완료 (${html.length} bytes)`);
    
    // HTML 저장 (디버깅용)
    fs.writeFileSync('the-edit-raw.html', html);
    console.log('💾 원본 HTML을 the-edit-raw.html에 저장했습니다.');
    
    // AI 아티클 추출
    const articles = extractAIArticles(html);
    console.log(`✅ ${articles.length}개의 AI 아티클 추출 완료`);
    
    // JSON으로 저장
    fs.writeFileSync('public/ai-articles.json', JSON.stringify(articles, null, 2));
    fs.writeFileSync('ai-articles.json', JSON.stringify(articles, null, 2));
    console.log('✅ ai-articles.json 저장 완료!');
    
    return articles;
  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
    // 에러 시 기존 데이터 유지
    try {
      if (fs.existsSync('public/ai-articles.json')) {
        const existing = JSON.parse(fs.readFileSync('public/ai-articles.json', 'utf8'));
        console.log(`⚠️ 기존 ${existing.length}개 아티클 유지`);
        return existing;
      }
    } catch (e) {
      console.log('⚠️ 기존 파일도 없습니다.');
    }
    return [];
  }
}

main();
