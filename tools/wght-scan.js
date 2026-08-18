/* Đo độ đậm thật của từng khối chữ trên bản gốc.

   Inter là font biến thiên: bản gốc chỉnh độ đậm bằng trục `wght` trong
   font-variation-settings chứ không dùng font-weight. Đọc mỗi font-weight thì
   khối nào cũng ra 400, chữ dựng lại mảnh hơn bản mẫu.

   Chạy:
     node tools/wght-scan.js                       → trang chủ, ghi wght.json
     node tools/wght-scan.js 6473183/ hoavarac     → trang con
     node tools/wght-scan.js 6473183/ hoavarac mobile
   Kết quả: wght-<tên>.json → { "<cỡ chữ>|<chữ>": 630, ... }  (chỉ khối khác 400)
*/
const path = require('path');
const fs = require('fs');
const { chromium } = require(process.env.PW ||
  '/Users/Apple/.npm/_npx/9833c18b2d85bc59/node_modules/playwright');

const EXE = process.env.HOME +
  '/Library/Caches/ms-playwright/chromium-1228/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';

const SITE = 'https://readymag.website/u1457614830/';
const SLUG = process.argv[2] || '6477513/';
const NAME = process.argv[3] || '';
const MOBILE = process.argv[4] === 'mobile';
const TEN = (MOBILE ? 'mobile' : '') + (NAME ? (MOBILE ? '-' : '') + NAME : '');
const OUT = path.join(__dirname, '..', TEN ? `wght-${TEN}.json` : 'wght.json');
const VIEW = MOBILE ? { width: 375, height: 812 } : { width: 1440, height: 900 };
const UA_MOBILE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) ' +
  'AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';


(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: EXE });
  const ctx = await browser.newContext(MOBILE
    ? { viewport: VIEW, isMobile: true, hasTouch: true, deviceScaleFactor: 2, userAgent: UA_MOBILE }
    : { viewport: VIEW });
  const page = await ctx.newPage();
  await page.goto(SITE + SLUG, { waitUntil: 'load' });
  await page.waitForTimeout(5000);

  const tu = await page.$('#CybotCookiebotDialogBodyButtonDecline');
  if (tu) { await tu.click(); await page.waitForTimeout(800); }

  // Trang con chỉ dựng đủ nội dung sau khi cuộn thật
  await page.mouse.move(VIEW.width / 2, VIEW.height / 2);
  for (let i = 0; i < 20; i++) { await page.mouse.wheel(0, 500); await page.waitForTimeout(130); }
  await page.waitForTimeout(1000);
  for (let i = 0; i < 26; i++) { await page.mouse.wheel(0, -500); await page.waitForTimeout(120); }
  await page.waitForTimeout(1500);

  /* Khoá theo NỘI DUNG chứ không theo mã kNN: mã do measure.js đánh theo thứ tự
     phần tử, mà mỗi lần mở trang Readymag lại dựng số phần tử khác nhau nên hai
     lần chạy cho ra mã lệch nhau. Chữ + cỡ chữ thì ổn định.

     Bản gốc chỉ đặt kiểu chữ khi phần đó vào khung nhìn, nên đọc một lần ở đầu
     trang là sót — quét lại ở nhiều mốc cuộn rồi gộp kết quả. */
  const doc = () => {
    const r = {};
    document.querySelectorAll('main *').forEach(el => {
      const own = [...el.childNodes].filter(x => x.nodeType === 3)
        .map(x => x.textContent).join('').trim();
      if (!own) return;
      const c = getComputedStyle(el);
      const m = (c.fontVariationSettings || '').match(/"wght"\s+(\d+)/);
      if (!m) return;
      const w = parseInt(m[1], 10);
      if (w === 400) return;
      const sig = c.fontSize + '|' + own.replace(/\s+/g, ' ').slice(0, 60);
      r[sig] = w;
    });
    return r;
  };

  const ket = {};
  const cao = await page.evaluate(() => document.body.scrollHeight);
  const mocs = [];
  for (let y = 0; y <= Math.max(cao - VIEW.height, 0); y += 600) mocs.push(y);
  if (!mocs.length) mocs.push(0);
  for (const y of mocs) {
    await page.evaluate(v => scrollTo(0, v), y);
    await page.waitForTimeout(500);
    Object.assign(ket, await page.evaluate(doc));
  }
  // trang con cuộn nội bộ: quét thêm bằng bánh xe chuột
  await page.evaluate(() => scrollTo(0, 0));
  await page.mouse.move(VIEW.width / 2, VIEW.height / 2);
  for (let i = 0; i < 24; i++) {
    await page.mouse.wheel(0, 400);
    await page.waitForTimeout(160);
    if (i % 3 === 0) Object.assign(ket, await page.evaluate(doc));
  }
  Object.assign(ket, await page.evaluate(doc));

  await browser.close();
  fs.writeFileSync(OUT, JSON.stringify(ket));
  console.log('khối có độ đậm khác 400:', Object.keys(ket).length);
  const dem = {};
  Object.values(ket).forEach(v => { dem[v] = (dem[v] || 0) + 1; });
  Object.entries(dem).sort((a, b) => a[0] - b[0])
    .forEach(([w, c]) => console.log('   wght %s → %s khối', w, c));
  console.log('→', path.basename(OUT));
})();
