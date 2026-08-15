/* Chụp đối chiếu bản gốc và bản dựng lại ở khổ điện thoại.
   Chạy: node tools/shot-mobile.js [trang…]   (mặc định: trang chính) */
const { chromium } = require(process.env.PW ||
  '/Users/Apple/.npm/_npx/9833c18b2d85bc59/node_modules/playwright');
const EXE = process.env.HOME +
  '/Library/Caches/ms-playwright/chromium-1228/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 ' +
  '(KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
const HOST = 'http://127.0.0.1:8811/';

// tên trang → [đường dẫn bản dựng lại, đường dẫn bản gốc]
const PAGES = {
  '':          ['index.html', '6477513/'],
  'hoavarac':  ['hoavarac.html', '6473183/'],
  'event':     ['event.html', '6473183/moreevent/'],
  'archive':   ['archive.html', '6473183/3/'],
  'visit':     ['visit.html', '6473183/visit/']
};
const MARKS = [0, 800, 1600, 2400];

(async () => {
  const which = process.argv.slice(2);
  const list = which.length ? which : [''];
  const browser = await chromium.launch({ headless: true, executablePath: EXE });
  for (const ten of list) {
    const [mine, orig] = PAGES[ten] || PAGES[''];
    for (const [tag, url, cookie] of [
      ['orig', 'https://readymag.website/u1457614830/' + orig, true],
      ['mine', HOST + mine, false]
    ]) {
      const ctx = await browser.newContext({
        viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true,
        deviceScaleFactor: 2, userAgent: UA
      });
      const page = await ctx.newPage();
      await page.goto(url, { waitUntil: 'load' });
      await page.waitForTimeout(cookie ? 5000 : 2500);
      if (cookie) {
        const d = await page.$('#CybotCookiebotDialogBodyButtonDecline');
        if (d) { await d.click(); await page.waitForTimeout(800); }
      }
      // Trang con của bản gốc cuộn nội bộ và chỉ hưởng ứng thao tác cuộn thật,
      // nên dùng bánh xe chuột cho cả hai bản để so cho công bằng.
      await page.mouse.move(187, 400);
      let dangO = 0;
      for (const y of MARKS) {
        while (dangO < y) {
          await page.mouse.wheel(0, Math.min(400, y - dangO));
          dangO += 400;
          await page.waitForTimeout(120);
        }
        await page.waitForTimeout(1400);
        await page.screenshot({ path: `shots/m${ten ? '-' + ten : ''}-${y}-${tag}.jpeg`,
                                type: 'jpeg', quality: 84 });
      }
      await ctx.close();
    }
    console.log('đã chụp', ten || 'trang chính');
  }
  await browser.close();
})();
