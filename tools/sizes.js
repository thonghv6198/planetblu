/* So bản gốc và bản dựng lại ở nhiều khổ cửa sổ khác nhau.
   Ghi ảnh vào shots/size-<rộng>x<cao>-{orig,mine}.jpeg và in vài mốc đo được.
   Chạy: node tools/sizes.js */
const path = require('path');
const { chromium } = require(process.env.PW ||
  '/Users/Apple/.npm/_npx/9833c18b2d85bc59/node_modules/playwright');

const EXE = process.env.HOME +
  '/Library/Caches/ms-playwright/chromium-1228/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const OUT = path.join(__dirname, '..', 'shots');

const SIZES = [[1440, 900], [1512, 850], [1728, 1000], [1280, 800]];

// đo vài mốc dễ đối chiếu: thanh điều hướng, ảnh lớn đầu trang, chiều cao tài liệu
const probe = () => {
  const nav = [...document.querySelectorAll('*')].filter(el => {
    const t = [...el.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join('').trim();
    return t.replace(/█/g, '').trim() === 'Event';
  })[0];
  let hero = null, best = 0;
  document.querySelectorAll('*').forEach(el => {
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    if (!s.backgroundImage.includes('image-') && el.tagName !== 'IMG') return;
    if (r.top < -50 || r.top > 400) return;
    const area = r.width * r.height;
    if (area > best) { best = area; hero = r; }
  });
  const r = nav ? nav.getBoundingClientRect() : null;
  return {
    vw: document.documentElement.clientWidth,
    vh: document.documentElement.clientHeight,
    docH: document.body.scrollHeight,
    nav: r ? [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height),
              getComputedStyle(nav).fontSize] : null,
    hero: hero ? [Math.round(hero.left), Math.round(hero.top), Math.round(hero.width), Math.round(hero.height)] : null
  };
};

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: EXE });
  for (const [w, h] of SIZES) {
    const row = {};
    for (const [tag, url, cookie] of [
      ['orig', 'https://readymag.website/u1457614830/6477513/', true],
      ['mine', 'http://127.0.0.1:8811/index.html', false]
    ]) {
      const page = await browser.newPage();
      await page.setViewportSize({ width: w, height: h });
      await page.goto(url, { waitUntil: 'load' });
      await page.waitForTimeout(cookie ? 5000 : 2500);
      if (cookie) {
        const d = await page.$('#CybotCookiebotDialogBodyButtonDecline');
        if (d) { await d.click(); await page.waitForTimeout(800); }
      }
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(1200);
      row[tag] = await page.evaluate(probe);
      await page.screenshot({ path: path.join(OUT, `size-${w}x${h}-${tag}.jpeg`), type: 'jpeg', quality: 86 });
      await page.close();
    }
    console.log(`\n=== ${w}x${h}`);
    console.log('  gốc :', JSON.stringify(row.orig));
    console.log('  của em:', JSON.stringify(row.mine));
  }
  await browser.close();
})();
