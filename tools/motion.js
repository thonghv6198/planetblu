/* Phân tích hiệu ứng của bản gốc, so với bản dựng lại.
   - cuộn bằng bánh xe chuột thật để xem có quán tính / bắt dính trang không
   - theo dõi vị trí một phần tử theo thời gian sau mỗi cú cuộn
   - kiểm tra hiệu ứng khi rê chuột lên ảnh, và lúc trang vừa tải
   Chạy: node tools/motion.js */
const { chromium } = require(process.env.PW ||
  '/Users/Apple/.npm/_npx/9833c18b2d85bc59/node_modules/playwright');

const EXE = process.env.HOME +
  '/Library/Caches/ms-playwright/chromium-1228/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';

const open = async (browser, url, cookie) => {
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForTimeout(cookie ? 5000 : 2500);
  if (cookie) {
    const d = await page.$('#CybotCookiebotDialogBodyButtonDecline');
    if (d) { await d.click(); await page.waitForTimeout(800); }
  }
  return page;
};

// vị trí cuộn theo thời gian sau một cú lăn chuột
const traceScroll = async (page) => {
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(1200);
  await page.mouse.move(720, 500);
  await page.mouse.wheel(0, 400);
  return await page.evaluate(() => new Promise(resolve => {
    const t0 = performance.now();
    const out = [];
    const tick = () => {
      out.push([Math.round(performance.now() - t0), Math.round(window.scrollY)]);
      if (performance.now() - t0 < 2000) requestAnimationFrame(tick);
      else resolve(out.filter((v, i) => i % 4 === 0));
    };
    tick();
  }));
};

// trang có "bắt dính" về mốc cố định sau khi ngừng cuộn không
const traceSettle = async (page) => {
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(1000);
  await page.mouse.move(720, 500);
  for (let i = 0; i < 3; i++) { await page.mouse.wheel(0, 300); await page.waitForTimeout(80); }
  await page.waitForTimeout(2500);
  return await page.evaluate(() => Math.round(window.scrollY));
};

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: EXE });

  for (const [tag, url, cookie] of [
    ['GỐC ', 'https://readymag.website/u1457614830/6477513/', true],
    ['EM  ', 'http://127.0.0.1:8811/index.html', false]
  ]) {
    const page = await open(browser, url, cookie);

    const scrollTrace = await traceScroll(page);
    console.log(tag, 'cuộn 400px →', JSON.stringify(scrollTrace.slice(0, 10)));

    const settle = await traceSettle(page);
    console.log(tag, 'sau 3 cú cuộn 300px rồi dừng, dừng ở:', settle);

    // hiệu ứng khi rê chuột lên ảnh lớn
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(1000);
    const before = await page.screenshot({ clip: { x: 300, y: 300, width: 400, height: 200 } });
    await page.mouse.move(500, 400);
    await page.waitForTimeout(900);
    const after = await page.screenshot({ clip: { x: 300, y: 300, width: 400, height: 200 } });
    console.log(tag, 'rê chuột lên ảnh lớn có đổi hình:', !before.equals(after));

    // con trỏ chuột
    const cursor = await page.evaluate(() => {
      const el = document.elementFromPoint(500, 400);
      return el ? getComputedStyle(el).cursor : null;
    });
    console.log(tag, 'con trỏ trên ảnh lớn:', cursor);

    await page.close();
  }
  await browser.close();
})();
