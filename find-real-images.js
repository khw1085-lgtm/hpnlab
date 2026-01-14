// 실제 Framer 마켓플레이스 이미지 URL 찾기
import https from 'https';

// 실제 Framer 마켓플레이스의 몇 가지 템플릿 페이지를 확인하여 이미지 URL 패턴 찾기
const testUrls = [
  'https://www.framer.com/marketplace/template/hoffen',
  'https://www.framer.com/marketplace/template/nitro',
  'https://www.framer.com/marketplace/component/glass'
];

function fetchHTML(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      }
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function findImagePatterns() {
  for (const url of testUrls) {
    try {
      console.log(`\n🔍 분석 중: ${url}`);
      const html = await fetchHTML(url);
      
      // 이미지 URL 찾기
      const imgMatches = html.match(/https?:\/\/[^"'\s]+\.(jpg|jpeg|png|webp|gif)/gi);
      if (imgMatches) {
        const framerImages = imgMatches.filter(url => url.includes('framerusercontent.com'));
        console.log(`📸 찾은 이미지 URL (${framerImages.length}개):`);
        framerImages.slice(0, 5).forEach(img => console.log(`  - ${img}`));
      }
      
      // JSON 데이터 찾기 (API 응답일 수 있음)
      const jsonMatches = html.match(/\{[^{}]*"image"[^{}]*\}/gi);
      if (jsonMatches) {
        console.log(`📦 JSON 데이터 발견: ${jsonMatches.length}개`);
      }
      
    } catch (error) {
      console.error(`❌ 에러: ${url}`, error.message);
    }
  }
}

findImagePatterns();
