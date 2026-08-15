/* Lấy danh sách ảnh của từng slideshow và đo nhịp tự chuyển của bản gốc.
   Chạy: node tools/slides.js → ghi slides.json */
const path = require('path');
const fs = require('fs');
const { chromium } = require(process.env.PW ||
  '/Users/Apple/.npm/_npx/9833c18b2d85bc59/node_modules/playwright');

const EXE = process.env.HOME +
  '/Library/Caches/ms-playwright/chromium-1228/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: EXE });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('https://readymag.website/u1457614830/6477513/', { waitUntil: 'load' });
  await page.waitForTimeout(5000);
  const d = await page.$('#CybotCookiebotDialogBodyButtonDecline');
  if (d) { await d.click(); await page.waitForTimeout(800); }

  const shows = await page.evaluate(() => {
    return [...document.querySelectorAll('.common-slideshow')].map(ss => {
      const r = ss.getBoundingClientRect();
      const imgs = [...ss.querySelectorAll('.image')].map(i => ({
        cls: i.className,
        url: (getComputedStyle(i).backgroundImage.match(/url\("([^"]+)"\)/) || [])[1] || null,
        size: getComputedStyle(i).backgroundSize,
        pos: getComputedStyle(i).backgroundPosition
      }));
      return { rect: [r.left, r.top, r.width, r.height], imgs };
    });
  });

  // đo nhịp tự chuyển: theo dõi ảnh ở giữa trong 24 giây
  const timeline = await page.evaluate(() => new Promise(resolve => {
    const el = document.querySelector('.common-slideshow .center-image');
    if (!el) return resolve([]);
    const out = [];
    let last = null;
    const t0 = performance.now();
    const id = setInterval(() => {
      const u = (getComputedStyle(el).backgroundImage.match(/image-[a-f0-9-]+/) || [''])[0];
      if (u !== last) { out.push([Math.round(performance.now() - t0), u]); last = u; }
      if (performance.now() - t0 > 24000) { clearInterval(id); resolve(out); }
    }, 100);
  }));

  fs.writeFileSync(path.join(__dirname, '..', 'slides.json'),
    JSON.stringify({ shows, timeline }, null, 1));
  console.log('slideshow:', shows.length);
  shows.forEach((s, i) => console.log(' ', i, s.rect.map(Math.round).join(','),
    s.imgs.map(x => (x.url || '').replace(/.*image-/, '').slice(0, 8)).join(' ')));
  console.log('mốc đổi ảnh (ms):', JSON.stringify(timeline));
  await browser.close();
})();
