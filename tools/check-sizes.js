/* Đối chiếu bản gốc và bản dựng lại ở nhiều khổ cửa sổ: vị trí thanh điều hướng,
   vị trí và kích thước ảnh lớn đầu trang. Chạy: node tools/check-sizes.js */
const { chromium } = require(process.env.PW ||
  '/Users/Apple/.npm/_npx/9833c18b2d85bc59/node_modules/playwright');

const EXE = process.env.HOME +
  '/Library/Caches/ms-playwright/chromium-1228/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';

const SIZES = [[1440, 900], [1512, 850], [1728, 1000], [1280, 800], [1366, 768], [1920, 1080]];

// Trên bản gốc, khung của phần tử con trong lớp phóng được trả về ở hệ chưa phóng,
// nên nhân lại với zoom để ra vị trí thật trên màn hình.
const probeOrig = () => {
  const zc = document.querySelector('.page-content-container');
  const zoom = zc ? parseFloat(getComputedStyle(zc).zoom) : 1;
  const hero = document.querySelector('.common-slideshow .center-image');
  const nav = [...document.querySelectorAll('*')].find(el => {
    const t = [...el.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join('').trim();
    return t.replace(/█/g, '').trim() === 'Event' && el.getBoundingClientRect().width > 1;
  });
  const r = hero ? hero.getBoundingClientRect() : null;
  const nr = nav ? nav.getBoundingClientRect() : null;
  return {
    nav: nr ? [Math.round(nr.left), Math.round(nr.top)] : null,
    hero: r ? [Math.round(r.left * zoom), Math.round(r.top * zoom),
               Math.round(r.width * zoom), Math.round(r.height * zoom)] : null
  };
};

const probeMine = () => {
  const hero = document.querySelector('.slideshow');
  const nav = [...document.querySelectorAll('.el.txt')].find(el =>
    (el.textContent || '').replace(/█/g, '').trim() === 'Event');
  const r = hero ? hero.getBoundingClientRect() : null;
  const nr = nav ? nav.getBoundingClientRect() : null;
  return {
    nav: nr ? [Math.round(nr.left), Math.round(nr.top)] : null,
    hero: r ? [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)] : null
  };
};

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: EXE });
  let worst = 0;
  for (const [w, h] of SIZES) {
    const res = {};
    for (const [tag, url, cookie, fn] of [
      ['orig', 'https://readymag.website/u1457614830/6477513/', true, probeOrig],
      ['mine', 'http://127.0.0.1:8811/index.html', false, probeMine]
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
      res[tag] = await page.evaluate(fn);
      await page.close();
    }
    const diff = (a, b) => a && b ? a.map((v, i) => Math.abs(v - b[i])) : null;
    const dh = diff(res.orig.hero, res.mine.hero) || [];
    const dn = diff(res.orig.nav, res.mine.nav) || [];
    const m = Math.max(...dh, ...dn);
    worst = Math.max(worst, m);
    console.log(`${w}x${h}  menu lệch ${dn.join('/')}px  ảnh lớn lệch ${dh.join('/')}px`);
  }
  console.log('=> lệch lớn nhất:', worst, 'px');
  await browser.close();
})();
