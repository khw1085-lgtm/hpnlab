// 국내 AI 아티클 통합 크롤링 스크립트 (저작권 문제 최소화)
// ⚠️ 주의: RSS 피드 사용은 일반적으로 허용되지만, 각 사이트의 이용약관을 확인하세요.
// 본 스크립트는 제목, 링크, 요약만 표시하며 본문은 원본 링크로 이동합니다.
import https from 'https';
import http from 'http';
import fs from 'fs';

const baseUrl = 'https://the-edit.co.kr/';
const eoplaUrl = 'https://eopla.net/';
const aiKeywords = ['AI', 'ai', '인공지능', '머신러닝', '딥러닝', '챗GPT', 'GPT', '로봇', '자동화', '생성형', '제미나이', 'Gemini', '클로드', '앤트로픽', '오픈AI', '코워크', 'CES', '로봇', '안경', '카메라', '스마트', '디지털', '테크', '기술', '에이전트', 'Agent', 'ChatGPT', 'OpenAI'];

// RSS 피드 URL 목록 (공개 RSS 피드 사용)
const rssFeeds = [
  {
    name: 'AI타임스',
    url: 'https://cdn.aitimes.com/rss/gn_rss_allArticle.xml',
    filter: (item) => {
      const title = (item.title || '').toLowerCase();
      const description = (item.description || '').toLowerCase();
      return aiKeywords.some(keyword => 
        title.includes(keyword.toLowerCase()) || 
        description.includes(keyword.toLowerCase())
      );
    }
  }
];

// HTML 가져오기
function fetchHTML(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    protocol.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
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

// The Edit 사이트에서 AI 관련 아티클 추출 (개선된 버전)
function extractTheEditArticles(html) {
  const articles = [];
  const seenUrls = new Set();
  
  // 더 포괄적인 패턴으로 아티클 링크 추출
  // 패턴 1: 일반 링크
  const linkPatterns = [
    /<a[^>]*href="(https:\/\/the-edit\.co\.kr\/\d+)"[^>]*>([^<]+)<\/a>/gi,
    /<a[^>]*href="(\/\/the-edit\.co\.kr\/\d+)"[^>]*>([^<]+)<\/a>/gi,
    /href="(https:\/\/the-edit\.co\.kr\/(\d+))"[^>]*>[\s\S]{0,500}?<h[23][^>]*>([^<]+)<\/h[23]>/gi
  ];
  
  // 썸네일 이미지 추출 - 더 포괄적인 패턴
  const imagePatterns = [
    // 패턴 1: 이미지 링크와 함께 있는 경우
    /<a[^>]*href="(https:\/\/the-edit\.co\.kr\/\d+)"[^>]*>[\s\S]*?<img[^>]*(?:data-lazy-src|data-src|src)="([^"]+)"[^>]*>/gi,
    // 패턴 2: wp-content/uploads 이미지
    /href="(https:\/\/the-edit\.co\.kr\/(\d+))"[^>]*>[\s\S]*?wp-content\/uploads\/([^"'\s]+\.(jpg|jpeg|png|webp))/gi,
    // 패턴 3: 배경 이미지
    /href="(https:\/\/the-edit\.co\.kr\/(\d+))"[^>]*>[\s\S]*?background-image:\s*url\(["']?([^"')]+\.(jpg|jpeg|png|webp))["']?\)/gi
  ];
  
  // 이미지와 URL 매핑 (더 정확한 추출)
  const imageMap = new Map();
  
  // 모든 이미지 패턴으로 이미지 추출
  for (const pattern of imagePatterns) {
    let match;
    while ((match = pattern.exec(html)) !== null) {
      const url = match[1] || `https://the-edit.co.kr/${match[2]}`;
      let imageUrl = match[2] || match[3] || match[4];
      
      if (imageUrl && !imageUrl.startsWith('data:') && !imageUrl.includes('placeholder') && !imageUrl.includes('logo')) {
        // 상대 경로를 절대 경로로 변환
        if (imageUrl.startsWith('/')) {
          imageUrl = `https://the-edit.co.kr${imageUrl}`;
        } else if (!imageUrl.startsWith('http')) {
          if (imageUrl.includes('wp-content')) {
            imageUrl = `https://the-edit.co.kr/${imageUrl}`;
          } else {
            imageUrl = `https://the-edit.co.kr/wp-content/uploads/${imageUrl}`;
          }
        }
        
        // 이미지 URL이 유효한 경우에만 저장
        if (imageUrl.match(/\.(jpg|jpeg|png|webp)/i) && !imageMap.has(url)) {
          imageMap.set(url, imageUrl);
        }
      }
    }
  }
  
  // 모든 링크 패턴으로 아티클 추출
  for (const pattern of linkPatterns) {
    let match;
    while ((match = pattern.exec(html)) !== null) {
      let url = match[1];
      let title = match[2] || match[3] || '';
      
      // URL 정규화
      if (url.startsWith('//')) {
        url = 'https:' + url;
      } else if (url.startsWith('/')) {
        url = 'https://the-edit.co.kr' + url;
      }
      
      // 숫자 ID만 있는 경우
      if (url.match(/\/\d+$/) && !title) {
        const idMatch = url.match(/\/(\d+)$/);
        if (idMatch) {
          // 제목을 다시 찾기
          const titlePattern = new RegExp(`href="${url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]*>([^<]+)<\/a>`, 'i');
          const titleMatch = html.match(titlePattern);
          if (titleMatch) {
            title = titleMatch[1].trim();
          }
        }
      }
      
      title = title.trim();
      
      if (!title || !url.match(/\/\d+$/)) continue;
      
      // AI 키워드 필터링 (더 포괄적으로)
      const titleLower = title.toLowerCase();
      const hasAIKeyword = aiKeywords.some(keyword => 
        titleLower.includes(keyword.toLowerCase()) || 
        title.includes(keyword)
      );
      
      if (hasAIKeyword && !seenUrls.has(url)) {
        seenUrls.add(url);
        
        // 날짜 추출 (더 넓은 범위에서)
        const contextStart = Math.max(0, match.index - 1000);
        const contextEnd = Math.min(html.length, match.index + 1000);
        const context = html.substring(contextStart, contextEnd);
        
        const datePatterns = [
          /(\d{4}\.\s*\d{1,2}\.\s*\d{1,2})/,
          /(\d{4}-\d{2}-\d{2})/,
          /<time[^>]*>([^<]+)<\/time>/i,
          /datetime="([^"]+)"/i
        ];
        
        let date = '';
        for (const dp of datePatterns) {
          const dateMatch = context.match(dp);
          if (dateMatch) {
            date = dateMatch[1].replace(/\s/g, '').replace(/-/g, '.');
            break;
          }
        }
        
        // 작성자 추출
        const authorPatterns = [
          /<p[^>]*class="[^"]*author[^"]*"[^>]*>([^<]+)<\/p>/i,
          /<span[^>]*class="[^"]*author[^"]*"[^>]*>([^<]+)<\/span>/i,
          /by\s+([^<\n]+)/i
        ];
        
        let author = '디에디트';
        for (const ap of authorPatterns) {
          const authorMatch = context.match(ap);
          if (authorMatch) {
            author = authorMatch[1].trim();
            break;
          }
        }
        
        // 설명 추출
        const descPatterns = [
          new RegExp(`href="${url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]*>[^<]+<\/a>\\s*<p[^>]*>([^<]+)<\/p>`, 'i'),
          new RegExp(`href="${url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]*>[^<]+<\/a>\\s*<div[^>]*>([^<]+)<\/div>`, 'i'),
          new RegExp(`<p[^>]*class="[^"]*excerpt[^"]*"[^>]*>([^<]+)<\/p>`, 'i')
        ];
        
        let description = '';
        for (const dp of descPatterns) {
          const descMatch = html.substring(match.index, match.index + 1500).match(dp);
          if (descMatch && descMatch[1]) {
            description = descMatch[1].trim();
            break;
          }
        }
        
        if (description.length > 150) {
          description = description.substring(0, 150) + '...';
        }
        
        // 썸네일 이미지 추출 (여러 방법 시도)
        let thumbnail = imageMap.get(url) || '';
        
        // 이미지가 없으면 URL 주변에서 다시 찾기
        if (!thumbnail) {
          const imgContext = html.substring(Math.max(0, match.index - 500), match.index + 500);
          const imgMatch = imgContext.match(/<img[^>]*(?:data-lazy-src|data-src|src)="([^"]+\.(jpg|jpeg|png|webp))"[^>]*>/i);
          if (imgMatch) {
            thumbnail = imgMatch[1];
            if (thumbnail.startsWith('/')) {
              thumbnail = `https://the-edit.co.kr${thumbnail}`;
            } else if (!thumbnail.startsWith('http')) {
              thumbnail = `https://the-edit.co.kr/${thumbnail}`;
            }
          }
        }
        
        // wp-content/uploads 패턴으로 직접 찾기
        if (!thumbnail) {
          const uploadsMatch = html.substring(Math.max(0, match.index - 1000), match.index + 1000)
            .match(/wp-content\/uploads\/[^"'\s]+\.(jpg|jpeg|png|webp)/i);
          if (uploadsMatch) {
            thumbnail = `https://the-edit.co.kr/${uploadsMatch[0]}`;
          }
        }
        
        articles.push({
          title: title,
          url: url,
          description: description || title,
          thumbnail: thumbnail,
          author: author,
          date: date || new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\./g, '.').replace(/\s/g, '')
        });
      }
    }
  }
  
  return articles;
}

// EOPLA 사이트에서 AI 관련 아티클 추출
function extractEoplaArticles(html) {
  const articles = [];
  const seenUrls = new Set();
  
  // 아티클 링크 패턴: eopla.net의 실제 구조에 맞게 수정
  // 웹 검색 결과를 보면 아티클들이 카드 형태로 표시됨
  const linkPatterns = [
    /<a[^>]*href="(https:\/\/eopla\.net\/[^"]+)"[^>]*>[\s\S]*?<\/a>/gi,
    /href="(\/[^"]+)"[^>]*>/gi
  ];
  
  // 이미지 패턴
  const imagePatterns = [
    /<img[^>]*(?:data-src|data-lazy-src|src)="([^"]+\.(jpg|jpeg|png|webp|gif))"[^>]*>/gi,
    /background-image:\s*url\(["']?([^"')]+\.(jpg|jpeg|png|webp|gif))["']?\)/gi
  ];
  
  // 이미지와 URL 매핑
  const imageMap = new Map();
  
  // 모든 이미지 패턴으로 이미지 추출
  for (const pattern of imagePatterns) {
    let match;
    while ((match = pattern.exec(html)) !== null) {
      let imageUrl = match[1];
      if (imageUrl && !imageUrl.startsWith('data:') && !imageUrl.includes('logo') && !imageUrl.includes('icon')) {
        if (imageUrl.startsWith('/')) {
          imageUrl = `https://eopla.net${imageUrl}`;
        } else if (!imageUrl.startsWith('http')) {
          imageUrl = `https://eopla.net/${imageUrl}`;
        }
        // 이미지 URL을 임시로 저장 (나중에 아티클과 매칭)
        if (imageUrl.match(/\.(jpg|jpeg|png|webp|gif)/i)) {
          imageMap.set(imageUrl, imageUrl);
        }
      }
    }
  }
  
  // 모든 링크 패턴으로 아티클 추출
  for (const pattern of linkPatterns) {
    let match;
    while ((match = pattern.exec(html)) !== null) {
      let url = match[1];
      
      // 상대 경로를 절대 경로로 변환
      if (url.startsWith('/')) {
        url = `https://eopla.net${url}`;
      } else if (!url.startsWith('http')) {
        url = `https://eopla.net/${url}`;
      }
      
      // 유효한 아티클 URL인지 확인 (메인 페이지, 로그인 등 제외)
      if (url.includes('#') || url.includes('javascript:') || url.includes('mailto:') || 
          url === 'https://eopla.net/' || url === 'https://eopla.net' ||
          url.includes('/login') || url.includes('/signup') || url.includes('/search')) {
        continue;
      }
      
      // 아티클 페이지인지 확인 (숫자 ID가 있거나 특정 경로 패턴)
      if (!url.match(/\/\d+$/) && !url.includes('/@') && !url.match(/\/[a-zA-Z0-9-]+$/)) {
        continue;
      }
      
      if (seenUrls.has(url)) continue;
      
      // 제목 추출 (링크 텍스트 또는 근처의 제목 태그)
      const contextStart = Math.max(0, match.index - 1000);
      const contextEnd = Math.min(html.length, match.index + 1500);
      const context = html.substring(contextStart, contextEnd);
      
      // 제목 패턴들 (더 포괄적으로)
      const titlePatterns = [
        new RegExp(`href="${url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]*>[\s\S]{0,200}?([^<]{10,200})<\/a>`, 'i'),
        new RegExp(`href="${url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]*>[\s\S]{0,500}?<h[1-6][^>]*>([^<]+)<\/h[1-6]>`, 'i'),
        /<h[1-6][^>]*>([^<]{10,200})<\/h[1-6]>/i,
        /<div[^>]*class="[^"]*title[^"]*"[^>]*>([^<]{10,200})<\/div>/i,
        /<span[^>]*class="[^"]*title[^"]*"[^>]*>([^<]{10,200})<\/span>/i,
        /<a[^>]*>([^<]{10,200})<\/a>/i
      ];
      
      let title = '';
      for (const tp of titlePatterns) {
        const titleMatch = context.match(tp);
        if (titleMatch && titleMatch[1]) {
          title = titleMatch[1].trim();
          // HTML 태그 제거
          title = title.replace(/<[^>]+>/g, '').trim();
          if (title.length > 5 && title.length < 200 && !title.includes('http')) {
            break;
          }
        }
      }
      
      // 제목이 없으면 스킵
      if (!title || title.length < 5) continue;
      
      // AI 키워드 필터링
      const titleLower = title.toLowerCase();
      const hasAIKeyword = aiKeywords.some(keyword => 
        titleLower.includes(keyword.toLowerCase()) || 
        title.includes(keyword)
      );
      
      if (!hasAIKeyword) continue;
      
      seenUrls.add(url);
      
      // 날짜 추출
      const datePatterns = [
        /(\d{4}\.\s*\d{1,2}\.\s*\d{1,2})/,
        /(\d{4}-\d{2}-\d{2})/,
        /(\d{1,2}\s*(일|시간|분)\s*전)/i,
        /<time[^>]*>([^<]+)<\/time>/i,
        /datetime="([^"]+)"/i
      ];
      
      let date = '';
      for (const dp of datePatterns) {
        const dateMatch = context.match(dp);
        if (dateMatch) {
          date = dateMatch[1].trim();
          // "N일 전", "N시간 전" 형식 처리
          if (date.includes('일 전') || date.includes('시간 전') || date.includes('분 전')) {
            const daysAgo = parseInt(date.match(/\d+/)?.[0] || '0');
            const now = new Date();
            if (date.includes('일 전')) {
              now.setDate(now.getDate() - daysAgo);
            } else if (date.includes('시간 전')) {
              now.setHours(now.getHours() - daysAgo);
            } else if (date.includes('분 전')) {
              now.setMinutes(now.getMinutes() - daysAgo);
            }
            date = now.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\./g, '.').replace(/\s/g, '');
          } else {
            date = date.replace(/\s/g, '').replace(/-/g, '.');
          }
          break;
        }
      }
      
      // 작성자 추출
      const authorPatterns = [
        /<div[^>]*class="[^"]*author[^"]*"[^>]*>([^<]+)<\/div>/i,
        /<span[^>]*class="[^"]*author[^"]*"[^>]*>([^<]+)<\/span>/i,
        /<p[^>]*class="[^"]*author[^"]*"[^>]*>([^<]+)<\/p>/i,
        /@([a-zA-Z0-9가-힣_]+)/i
      ];
      
      let author = '이오플래닛';
      for (const ap of authorPatterns) {
        const authorMatch = context.match(ap);
        if (authorMatch && authorMatch[1]) {
          author = authorMatch[1].trim();
          if (author.length > 1 && author.length < 50) {
            break;
          }
        }
      }
      
      // 설명 추출
      const descPatterns = [
        /<p[^>]*class="[^"]*description[^"]*"[^>]*>([^<]+)<\/p>/i,
        /<div[^>]*class="[^"]*excerpt[^"]*"[^>]*>([^<]+)<\/div>/i,
        /<p[^>]*>([^<]{20,150})<\/p>/i
      ];
      
      let description = '';
      for (const dp of descPatterns) {
        const descMatch = context.match(dp);
        if (descMatch && descMatch[1]) {
          description = descMatch[1].trim();
          if (description.length > 20 && description.length < 200) {
            break;
          }
        }
      }
      
      if (description.length > 150) {
        description = description.substring(0, 150) + '...';
      }
      
      // 썸네일 이미지 추출 (더 넓은 범위에서 찾기)
      let thumbnail = '';
      
      // URL 주변에서 이미지 찾기 (더 넓은 범위)
      const imgContext = html.substring(Math.max(0, match.index - 1500), match.index + 1500);
      
      // 여러 이미지 패턴 시도
      const imgPatterns = [
        /<img[^>]*(?:data-src|data-lazy-src|src)="([^"]+\.(jpg|jpeg|png|webp|gif))"[^>]*>/gi,
        /background-image:\s*url\(["']?([^"')]+\.(jpg|jpeg|png|webp|gif))["']?\)/gi,
        /<img[^>]*src="([^"]+)"[^>]*>/gi,
        /url\(["']?([^"')]+\.(jpg|jpeg|png|webp|gif))["']?\)/gi
      ];
      
      const foundImages = [];
      for (const pattern of imgPatterns) {
        let imgMatch;
        while ((imgMatch = pattern.exec(imgContext)) !== null) {
          let imgUrl = imgMatch[1];
          if (imgUrl && !imgUrl.startsWith('data:') && !imgUrl.includes('logo') && 
              !imgUrl.includes('icon') && !imgUrl.includes('profile_eo') && 
              !imgUrl.includes('favicon') && !imgUrl.includes('avatar')) {
            if (imgUrl.startsWith('/')) {
              imgUrl = `https://eopla.net${imgUrl}`;
            } else if (!imgUrl.startsWith('http')) {
              imgUrl = `https://eopla.net/${imgUrl}`;
            }
            if (imgUrl.match(/\.(jpg|jpeg|png|webp|gif)/i)) {
              foundImages.push(imgUrl);
            }
          }
        }
      }
      
      // 가장 적절한 이미지 선택 (첫 번째 유효한 이미지)
      if (foundImages.length > 0) {
        thumbnail = foundImages[0];
        // HTML 엔티티 디코딩
        thumbnail = thumbnail.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');
      }
      
      // 이미지가 없으면 빈 문자열 (기본 그라데이션 사용)
      if (!thumbnail) {
        thumbnail = '';
      }
      
      articles.push({
        title: title,
        url: url,
        description: description || title,
        thumbnail: thumbnail,
        author: author,
        date: date || new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\./g, '.').replace(/\s/g, '')
      });
    }
  }
  
  return articles;
}

// XML 파싱 (간단한 버전)
function parseRSS(xml) {
  const items = [];
  
  // <item> 태그 추출
  const itemPattern = /<item[^>]*>([\s\S]*?)<\/item>/gi;
  let match;
  
  while ((match = itemPattern.exec(xml)) !== null && items.length < 50) {
    const itemXml = match[1];
    
    // 제목 추출
    const titleMatch = itemXml.match(/<title[^>]*><!\[CDATA\[(.*?)\]\]><\/title>/i) ||
                      itemXml.match(/<title[^>]*>(.*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim()
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&#39;/g, "'")
      : '';
    
    // 링크 추출
    const linkMatch = itemXml.match(/<link[^>]*>(.*?)<\/link>/i) ||
                     itemXml.match(/<link[^>]*><!\[CDATA\[(.*?)\]\]><\/link>/i);
    const link = linkMatch ? linkMatch[1].trim() : '';
    
    // 설명 추출 (요약만 사용, 본문은 원본 링크로 이동)
    const descMatch = itemXml.match(/<description[^>]*><!\[CDATA\[(.*?)\]\]><\/description>/i) ||
                     itemXml.match(/<description[^>]*>(.*?)<\/description>/i);
    let description = descMatch ? descMatch[1].trim()
      .replace(/<[^>]+>/g, '') // HTML 태그 제거
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ')
      : '';
    
    // 설명 길이 제한 (저작권 문제 최소화: 요약만 표시)
    // RSS 피드의 요약 부분만 사용하며, 전체 본문은 원본 링크로 이동
    if (description.length > 150) {
      description = description.substring(0, 150) + '...';
    }
    
    // 본문이 포함된 경우 제거 (요약만 유지)
    if (description.length > 500) {
      description = description.substring(0, 150) + '... (원문 보기)';
    }
    
    // 날짜 추출
    const dateMatch = itemXml.match(/<pubDate[^>]*>(.*?)<\/pubDate>/i) ||
                     itemXml.match(/<dc:date[^>]*>(.*?)<\/dc:date>/i);
    let date = '';
    if (dateMatch) {
      const dateStr = dateMatch[1].trim();
      try {
        const dateObj = new Date(dateStr);
        if (!isNaN(dateObj.getTime())) {
          date = dateObj.toLocaleDateString('ko-KR', { 
            year: 'numeric', 
            month: '2-digit', 
            day: '2-digit' 
          }).replace(/\./g, '.').replace(/\s/g, '');
        }
      } catch (e) {
        // 날짜 파싱 실패 시 원본 문자열 사용
        date = dateStr.substring(0, 10);
      }
    }
    
    // 썸네일 이미지 추출
    const imageMatch = itemXml.match(/<enclosure[^>]*url="([^"]*)"[^>]*>/i) ||
                      itemXml.match(/<media:content[^>]*url="([^"]*)"[^>]*>/i) ||
                      itemXml.match(/<image[^>]*url="([^"]*)"[^>]*>/i) ||
                      itemXml.match(/<img[^>]*src="([^"]*)"[^>]*>/i);
    const thumbnail = imageMatch ? imageMatch[1] : '';
    
    if (title && link) {
      items.push({
        title: title,
        url: link,
        description: description || `${title} - AI 관련 기사`,
        thumbnail: thumbnail,
        author: 'AI타임스',
        date: date || new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\./g, '.').replace(/\s/g, '')
      });
    }
  }
  
  return items;
}

// RSS 피드 가져오기
function fetchRSS(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    protocol.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
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

// HTML 페이지 생성
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
        <p class="work-subtitle">디에디트와 이오플래닛에서 수집한 AI 관련 기사입니다. 클릭 시 원본 기사로 이동합니다.</p>
      </div>

      <div class="work-grid">
        ${articles.map((article, index) => {
          // HTML 특수문자 이스케이프
          const escapeHtml = (text) => {
            if (!text) return '';
            return String(text)
              .replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;')
              .replace(/'/g, '&#39;');
          };
          
          const title = escapeHtml(article.title);
          const description = escapeHtml(article.description);
          const thumbnail = article.thumbnail ? escapeHtml(article.thumbnail) : '';
          
          return `
          <a href="${escapeHtml(article.url)}" target="_blank" rel="noopener noreferrer" class="work-item" data-index="${index}">
            ${thumbnail ? `
            <div class="work-thumbnail">
              <img src="${thumbnail}" alt="${title}" onerror="this.parentElement.style.background='linear-gradient(135deg, #667eea 0%, #764ba2 100%)'" />
            </div>
            ` : `
            <div class="work-thumbnail"></div>
            `}
            <div class="work-info">
              <div class="work-type">Article</div>
              <h3 class="work-name">${title}</h3>
              <p class="work-description">${description}</p>
              <div class="work-meta">
                <span class="work-author">by ${escapeHtml(article.author)}</span>
                <span class="work-date">${escapeHtml(article.date)}</span>
              </div>
            </div>
          </a>
        `;
        }).join('')}
      </div>
    </div>
  </div>

  <script type="module" src="/page-script.js"></script>
</body>
</html>`;

  return html;
}

// JSON 파일 저장
function saveArticlesJSON(articles) {
  const jsonPath = 'public/ai-articles.json';
  fs.writeFileSync(jsonPath, JSON.stringify(articles, null, 2), 'utf-8');
  console.log(`✅ JSON 파일 저장 완료: ${jsonPath}`);
}

// 메인 실행
async function main() {
  let allArticles = [];
  
  // AI타임즈 RSS 피드 수집 비활성화 (디에디트만 사용)
  // 1. AI타임스 RSS 피드에서 수집 - 비활성화됨
  // for (const feed of rssFeeds) {
  //   try {
  //     console.log(`📡 ${feed.name} RSS 피드에서 데이터를 가져오는 중...`);
  //     const xml = await fetchRSS(feed.url);
  //     console.log(`✅ RSS 수신 완료 (${xml.length} bytes)`);
  //     
  //     // RSS 파싱
  //     const items = parseRSS(xml);
  //     console.log(`✅ ${items.length}개의 아이템 추출 완료`);
  //     
  //     // 필터 적용
  //     if (feed.filter) {
  //       const filtered = items.filter(feed.filter);
  //       console.log(`✅ 필터링 후 ${filtered.length}개의 AI 관련 기사`);
  //       allArticles = allArticles.concat(filtered);
  //     } else {
  //       allArticles = allArticles.concat(items);
  //     }
  //   } catch (error) {
  //     console.error(`❌ ${feed.name} RSS 피드 오류:`, error.message);
  //   }
  // }
  
  // 2. The Edit 사이트에서 AI 관련 기사 수집 (여러 페이지)
  try {
    const theEditUrls = [
      baseUrl, // 메인 페이지
      'https://the-edit.co.kr/', // 메인 페이지 (중복이지만 더 많은 기사 찾기)
    ];
    
    let allTheEditArticles = [];
    
    for (const url of theEditUrls) {
      try {
        console.log(`📡 The Edit 사이트에서 AI 아티클을 가져오는 중... (${url})`);
        const html = await fetchHTML(url);
        console.log(`✅ HTML 수신 완료 (${html.length} bytes)`);
        
        const theEditArticles = extractTheEditArticles(html);
        console.log(`✅ ${url}에서 ${theEditArticles.length}개의 AI 관련 기사 추출 완료`);
        
        allTheEditArticles = allTheEditArticles.concat(theEditArticles);
        
        // 요청 간 딜레이 (서버 부하 방지)
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`❌ ${url} 오류:`, error.message);
      }
    }
    
    // 중복 제거
    const uniqueTheEditArticles = [];
    const seenTheEditUrls = new Set();
    for (const article of allTheEditArticles) {
      if (!seenTheEditUrls.has(article.url)) {
        seenTheEditUrls.add(article.url);
        uniqueTheEditArticles.push(article);
      }
    }
    
    console.log(`✅ The Edit에서 총 ${uniqueTheEditArticles.length}개의 고유한 AI 관련 기사 추출 완료`);
    allArticles = allArticles.concat(uniqueTheEditArticles);
  } catch (error) {
    console.error(`❌ The Edit 사이트 오류:`, error.message);
  }
  
  // 3. EOPLA 사이트에서 AI 관련 기사 수집
  try {
    console.log(`📡 EOPLA 사이트에서 AI 아티클을 가져오는 중...`);
    const html = await fetchHTML(eoplaUrl);
    console.log(`✅ HTML 수신 완료 (${html.length} bytes)`);
    
    const eoplaArticles = extractEoplaArticles(html);
    console.log(`✅ EOPLA에서 ${eoplaArticles.length}개의 AI 관련 기사 추출 완료`);
    
    // 추가 페이지도 수집 (페이지 2, 3 등)
    for (let page = 2; page <= 3; page++) {
      try {
        const pageUrl = `${eoplaUrl}?page=${page}`;
        console.log(`📡 EOPLA 페이지 ${page}에서 AI 아티클을 가져오는 중...`);
        const pageHtml = await fetchHTML(pageUrl);
        const pageArticles = extractEoplaArticles(pageHtml);
        console.log(`✅ EOPLA 페이지 ${page}에서 ${pageArticles.length}개의 AI 관련 기사 추출 완료`);
        eoplaArticles.push(...pageArticles);
        
        // 요청 간 딜레이
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`❌ EOPLA 페이지 ${page} 오류:`, error.message);
      }
    }
    
    // 중복 제거
    const uniqueEoplaArticles = [];
    const seenEoplaUrls = new Set();
    for (const article of eoplaArticles) {
      if (!seenEoplaUrls.has(article.url)) {
        seenEoplaUrls.add(article.url);
        uniqueEoplaArticles.push(article);
      }
    }
    
    console.log(`✅ EOPLA에서 총 ${uniqueEoplaArticles.length}개의 고유한 AI 관련 기사 추출 완료`);
    allArticles = allArticles.concat(uniqueEoplaArticles);
  } catch (error) {
    console.error(`❌ EOPLA 사이트 오류:`, error.message);
  }
  
  // 중복 제거 (URL 기준)
  const uniqueArticles = [];
  const seenUrls = new Set();
  
  for (const article of allArticles) {
    // 유효한 URL인지 확인
    if (!article.url || article.url === baseUrl || article.url === 'https://the-edit.co.kr/' || article.url === eoplaUrl) {
      continue;
    }
    
    if (!seenUrls.has(article.url)) {
      seenUrls.add(article.url);
      uniqueArticles.push(article);
    }
  }
  
  // 날짜순으로 정렬 (최신순)
  uniqueArticles.sort((a, b) => {
    const dateA = parseDate(a.date);
    const dateB = parseDate(b.date);
    return dateB - dateA; // 최신순
  });
  
  // 최대 100개로 제한 (더 많은 기사 표시)
  const finalArticles = uniqueArticles.slice(0, 100);
  
  console.log(`✅ 총 ${finalArticles.length}개의 고유한 AI 기사 추출 완료 (일자순 정렬)`);
  
  // JSON 파일 저장
  saveArticlesJSON(finalArticles);
  
  // HTML 페이지 생성
  const outputHtml = generateArticlesPage(finalArticles);
  fs.writeFileSync('ai-articles.html', outputHtml);
  console.log(`✅ ai-articles.html 생성 완료! ${finalArticles.length}개의 기사가 포함되었습니다.`);
}

// 날짜 파싱 헬퍼 함수
function parseDate(dateStr) {
  if (!dateStr) return new Date(0);
  
  // "2026.01.15." 또는 "2026.01.15" 형식 처리
  const cleaned = dateStr.replace(/\.$/, '').replace(/\./g, '-');
  const date = new Date(cleaned);
  
  if (isNaN(date.getTime())) {
    // 다른 형식 시도
    return new Date(dateStr);
  }
  
  return date;
}

main();
