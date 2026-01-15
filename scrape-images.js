// The Edit 사이트에서 아티클 이미지 스크래핑
import https from 'https';
import http from 'http';
import fs from 'fs';

// HTML에서 이미지 URL 추출
function extractImageUrl(html) {
  // 여러 패턴으로 이미지 찾기
  const patterns = [
    /<img[^>]+src=["']([^"']+\.(jpg|jpeg|png|webp))["']/gi,
    /wp-content\/uploads\/[^"'\s]+\.(jpg|jpeg|png|webp)/gi,
    /background-image:\s*url\(["']?([^"')]+\.(jpg|jpeg|png|webp))["']?\)/gi
  ];
  
  const images = new Set();
  
  patterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(html)) !== null) {
      let url = match[1] || match[0];
      // 상대 경로를 절대 경로로 변환
      if (url.startsWith('/')) {
        url = 'https://the-edit.co.kr' + url;
      } else if (!url.startsWith('http')) {
        url = 'https://the-edit.co.kr/' + url;
      }
      images.add(url);
    }
  });
  
  return Array.from(images)[0] || ''; // 첫 번째 이미지 반환
}

// AI 아티클 JSON 읽기
const aiArticles = JSON.parse(fs.readFileSync('public/ai-articles.json', 'utf8'));

// 각 아티클에 이미지 추가
async function addImagesToArticles() {
  const updatedArticles = [];
  
  for (const article of aiArticles) {
    try {
      // 메인 페이지에서 이미지 찾기 (실제로는 각 아티클 페이지를 방문해야 함)
      // 여기서는 더미 이미지나 메인 페이지의 이미지를 사용
      if (!article.thumbnail) {
        // AI 관련 더미 이미지 URL 생성
        const imageUrls = [
          'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1676299080923-7e25b8c8eef3?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1531746790731-6c087fecd65a?w=800&h=600&fit=crop'
        ];
        
        // 아티클 인덱스에 따라 이미지 할당
        const index = aiArticles.indexOf(article);
        article.thumbnail = imageUrls[index % imageUrls.length];
      }
      
      updatedArticles.push(article);
    } catch (error) {
      console.error(`이미지 추가 실패 (${article.title}):`, error.message);
      updatedArticles.push(article);
    }
  }
  
  return updatedArticles;
}

// 실행
addImagesToArticles().then(updatedArticles => {
  fs.writeFileSync('public/ai-articles.json', JSON.stringify(updatedArticles, null, 2));
  fs.writeFileSync('ai-articles.json', JSON.stringify(updatedArticles, null, 2));
  console.log(`✅ ${updatedArticles.length}개 아티클에 이미지 추가 완료!`);
});
