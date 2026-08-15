/* Tải video của bản gốc về máy.

   Readymag phát video dạng HLS: một playlist .m3u8 kèm nhiều mảnh .ts. Script mở
   từng trang, bắt địa chỉ playlist, rồi để ffmpeg ghép các mảnh thành một tệp mp4
   trong assets/. Ảnh poster cũng tải kèm để hiện trước khi bấm phát.

   Chạy: node tools/fetch-videos.js
*/
const path = require('path');
const fs = require('fs');
const { execFileSync } = require('child_process');
const { chromium } = require(process.env.PW ||
  '/Users/Apple/.npm/_npx/9833c18b2d85bc59/node_modules/playwright');

const EXE = process.env.HOME +
  '/Library/Caches/ms-playwright/chromium-1228/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const ROOT = path.join(__dirname, '..');
const SITE = 'https://readymag.website/u1457614830/';
const TRANG = ['6477513/', '6473183/', '6473183/moreevent/', '6473183/3/', '6473183/visit/'];

const chay = (cmd, args) => execFileSync(cmd, args, { stdio: 'pipe' });

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: EXE });
  const found = new Map();   // mã video -> { playlist, poster }

  for (const slug of TRANG) {
    const page = await browser.newPage();
    page.on('response', r => {
      const u = r.url().split('?')[0];
      const m = u.match(/\/([A-Za-z0-9_-]{10,})\/(playlist\.m3u8|poster\.jpg)$/);
      if (!m) return;
      const rec = found.get(m[1]) || {};
      rec[m[2] === 'poster.jpg' ? 'poster' : 'playlist'] = u;
      found.set(m[1], rec);
    });
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(SITE + slug, { waitUntil: 'load' });
    await page.waitForTimeout(5000);
    const d = await page.$('#CybotCookiebotDialogBodyButtonDecline');
    if (d) { await d.click(); await page.waitForTimeout(600); }
    await page.mouse.move(720, 500);
    for (let i = 0; i < 16; i++) { await page.mouse.wheel(0, 500); await page.waitForTimeout(220); }
    await page.waitForTimeout(2500);
    await page.close();
    console.log('quét', slug, '→ tổng cộng', found.size, 'video');
  }
  await browser.close();

  fs.mkdirSync(path.join(ROOT, 'assets'), { recursive: true });
  const manPath = path.join(ROOT, 'assets', 'videos.json');
  const man = fs.existsSync(manPath) ? JSON.parse(fs.readFileSync(manPath, 'utf8')) : {};

  for (const [ma, rec] of found) {
    if (!rec.playlist) continue;
    const mp4 = `video-${ma}.mp4`;
    const jpg = `video-${ma}.jpg`;
    const dichMp4 = path.join(ROOT, 'assets', mp4);
    if (!fs.existsSync(dichMp4)) {
      try {
        // ffmpeg tự tải playlist và mọi mảnh, rồi đóng gói lại không mã hoá lại
        chay('ffmpeg', ['-y', '-loglevel', 'error',
          '-headers', 'Referer: https://readymag.website/\r\n',
          '-i', rec.playlist, '-c', 'copy', '-bsf:a', 'aac_adtstoasc', dichMp4]);
        console.log('  ghép xong', mp4, (fs.statSync(dichMp4).size / 1048576).toFixed(1), 'MB');
      } catch (e) {
        console.log('  hỏng', mp4, String(e.stderr || e).slice(0, 120));
        continue;
      }
    }
    if (rec.poster && !fs.existsSync(path.join(ROOT, 'assets', jpg))) {
      try {
        chay('curl', ['-sS', '-L', '--max-time', '40', '-e', 'https://readymag.website/',
                      '-o', path.join(ROOT, 'assets', jpg), rec.poster]);
      } catch (e) { /* poster thiếu thì thôi */ }
    }
    man[ma] = { mp4: 'assets/' + mp4, poster: 'assets/' + jpg, playlist: rec.playlist };
  }

  fs.writeFileSync(manPath, JSON.stringify(man, null, 1));
  console.log('đã ghi assets/videos.json —', Object.keys(man).length, 'video');
})();
