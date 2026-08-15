/* Xem bản gốc ở khổ điện thoại: có bố cục riêng không, cuộn kiểu gì.
   Chạy: node tools/probe-mobile.js */
const { chromium, devices } = require(process.env.PW ||
  '/Users/Apple/.npm/_npx/9833c18b2d85bc59/node_modules/playwright');
const EXE = process.env.HOME +
  '/Library/Caches/ms-playwright/chromium-1228/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';

const SIZES = [[375, 812], [390, 844], [414, 896], [768, 1024]];

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: EXE });
  for (const [w, h] of SIZES) {
    const ctx = await browser.newContext({
      viewport: { width: w, height: h }, isMobile: true, hasTouch: true,
      deviceScaleFactor: 2,
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
    });
    const page = await ctx.newPage();
    await page.goto('https://readymag.website/u1457614830/6477513/', { waitUntil: 'load' });
    await page.waitForTimeout(5000);
    const d = await page.$('#CybotCookiebotDialogBodyButtonDecline');
    if (d) { await d.click(); await page.waitForTimeout(800); }
    const info = await page.evaluate(() => {
      const zc = document.querySelector('.page-content-container');
      let n = 0;
      document.querySelectorAll('main *').forEach(el => {
        const s = getComputedStyle(el);
        const own = [...el.childNodes].filter(x => x.nodeType === 3).map(x => x.textContent).join('').trim();
        if (own || el.tagName === 'IMG' || s.backgroundImage.includes('rmcdn')) n++;
      });
      const w = document.querySelector('.content-scroll-wrapper');
      return {
        docH: document.body.scrollHeight, phanTu: n,
        zoom: zc ? getComputedStyle(zc).zoom : null,
        canvas: zc ? [zc.offsetWidth, zc.offsetHeight] : null,
        cuonNoiBo: !!(w && w.scrollHeight > w.clientHeight + 4),
        lop: document.body.className.slice(0, 60)
      };
    });
    console.log(w + 'x' + h, JSON.stringify(info));
    await page.screenshot({ path: `shots/mobile-${w}-orig.jpeg`, type: 'jpeg', quality: 84 });
    await ctx.close();
  }
  await browser.close();
})();
