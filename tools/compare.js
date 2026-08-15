/* Chụp bản gốc và bản dựng lại ở cùng các mốc cuộn để đối chiếu.
   Chạy: node tools/compare.js [mốc1 mốc2 …] */
const path = require('path');
const { chromium } = require(process.env.PW ||
  '/Users/Apple/.npm/_npx/9833c18b2d85bc59/node_modules/playwright');

const EXE = process.env.HOME +
  '/Library/Caches/ms-playwright/chromium-1228/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const OUT = path.join(__dirname, '..', 'shots');
const MARKS = process.argv.slice(2).map(Number).filter(n => !isNaN(n));
const YS = MARKS.length ? MARKS : [0, 900, 1800, 2300, 3200, 4200, 5200, 5641];

(async () => {
  const fs = require('fs');
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true, executablePath: EXE });

  const shoot = async (url, tag, cookie) => {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(url, { waitUntil: 'load' });
    await page.waitForTimeout(cookie ? 5000 : 2500);
    if (cookie) {
      const d = await page.$('#CybotCookiebotDialogBodyButtonDecline');
      if (d) { await d.click(); await page.waitForTimeout(800); }
    }
    for (const y of YS) {
      await page.evaluate(v => window.scrollTo(0, v), y);
      await page.waitForTimeout(2200);
      await page.screenshot({ path: path.join(OUT, `${tag}-${y}.jpeg`), type: 'jpeg', quality: 86 });
    }
    await page.close();
  };

  await shoot('https://readymag.website/u1457614830/6477513/', 'orig', true);
  await shoot('http://127.0.0.1:8811/index.html', 'mine', false);
  console.log('đã chụp', YS.length * 2, 'ảnh vào', OUT);
  await browser.close();
})();
