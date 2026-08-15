/* Đo bổ sung mốc cuộn cuối cùng (không rơi đúng bội số của bước 50) và ghép vào
   measured.json. Chạy: node tools/measure-tail.js */
const path = require('path');
const fs = require('fs');
const { chromium } = require(process.env.PW ||
  '/Users/Apple/.npm/_npx/9833c18b2d85bc59/node_modules/playwright');

const EXE = process.env.HOME +
  '/Library/Caches/ms-playwright/chromium-1228/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const OUT = path.join(__dirname, '..', 'measured.json');

(async () => {
  const M = JSON.parse(fs.readFileSync(OUT, 'utf8'));
  const maxY = M.base.docH - 900;
  if (M.frames.some(f => f.y === maxY)) {
    console.log('đã có mốc', maxY);
    return;
  }

  const browser = await chromium.launch({ headless: true, executablePath: EXE });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('https://readymag.website/u1457614830/6477513/', { waitUntil: 'load' });
  await page.waitForTimeout(5000);
  const d = await page.$('#CybotCookiebotDialogBodyButtonDecline');
  if (d) { await d.click(); await page.waitForTimeout(800); }

  // gán lại khoá theo đúng thứ tự như lần đo chính
  await page.evaluate(() => {
    let n = 0;
    document.querySelectorAll('main *').forEach(el => {
      const s = getComputedStyle(el);
      const own = [...el.childNodes].filter(x => x.nodeType === 3).map(x => x.textContent).join('').trim();
      const isImg = el.tagName === 'IMG';
      const hasBg = s.backgroundImage.includes('rmcdn');
      if (!own && !isImg && !hasBg) return;
      if (el.tagName === 'STYLE' || el.tagName === 'SCRIPT') return;
      el.setAttribute('data-k', 'k' + (n++));
    });
  });

  // cuộn tuần tự tới cuối để trạng thái trùng với lần đo chính
  for (let y = 0; y <= maxY; y += 400) {
    await page.evaluate(v => window.scrollTo(0, v), y);
    await page.waitForTimeout(260);
  }
  await page.evaluate(v => window.scrollTo(0, v), maxY);
  await page.waitForTimeout(2500);

  // ghi khung của mọi phần tử đang hiện, giống hệt lần đo chính
  const f = await page.evaluate(() => {
    const items = {};
    document.querySelectorAll('main [data-k]').forEach(el => {
      const s = getComputedStyle(el);
      if (s.visibility === 'hidden' || s.display === 'none') return;
      const r = el.getBoundingClientRect();
      if (r.width < 0.5 || r.height < 0.5) return;
      const isImg = el.tagName === 'IMG';
      const fz = (isImg || s.backgroundImage.includes('rmcdn')) ? 1.4063 : 1;
      const L = Math.max(2, r.left * fz), T = Math.max(2, r.top * fz);
      const R = Math.min(innerWidth - 2, (r.left + r.width) * fz);
      const B = Math.min(innerHeight - 2, (r.top + r.height) * fz);
      let seen = 0, tried = 0;
      if (R > L && B > T) {
        for (const [ax, ay] of [[.5, .5], [.2, .2], [.8, .2], [.2, .8], [.8, .8]]) {
          tried++;
          if (document.elementsFromPoint(L + (R - L) * ax, T + (B - T) * ay).indexOf(el) >= 0) {
            seen = 1;
            break;
          }
        }
      }
      items[el.dataset.k] = [Math.round(r.left * 10) / 10, Math.round(r.top * 10) / 10,
                             Math.round(r.width * 10) / 10, Math.round(r.height * 10) / 10,
                             Math.round(parseFloat(s.opacity) * 100) / 100,
                             tried ? seen : -1];
    });
    return { y: Math.round(scrollY), items, path: location.pathname };
  });

  M.frames.push(f);
  M.frames.sort((a, b) => a.y - b.y);
  fs.writeFileSync(OUT, JSON.stringify(M));
  console.log('đã thêm mốc', f.y, '| phần tử:', Object.keys(f.items).length);
  await browser.close();
})();
