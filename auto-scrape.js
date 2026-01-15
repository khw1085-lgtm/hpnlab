// 자동 스크래핑 스케줄러
// 이 스크립트는 주기적으로 AI 아티클을 스크래핑합니다
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// 스크래핑 실행
async function runScrape() {
  try {
    console.log(`[${new Date().toISOString()}] AI 아티클 스크래핑 시작...`);
    const { stdout, stderr } = await execAsync('node scrape-the-edit.js');
    console.log(stdout);
    if (stderr) {
      console.error(stderr);
    }
    console.log(`[${new Date().toISOString()}] 스크래핑 완료`);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] 스크래핑 오류:`, error.message);
  }
}

// 즉시 실행
runScrape();

// 주기적으로 실행 (6시간마다)
const interval = 6 * 60 * 60 * 1000; // 6시간
setInterval(runScrape, interval);

console.log('자동 스크래핑 스케줄러가 시작되었습니다. (6시간마다 실행)');
