/* Đo bản gốc ở nhiều khổ cửa sổ để tìm quy luật co giãn.
   Chạy: node tools/probe-sizes.js */
const { chromium } = require(process.env.PW ||
  '/Users/Apple/.npm/_npx/9833c18b2d85bc59/node_modules/playwright');

const EXE = process.env.HOME +
  '/Library/Caches/ms-playwright/chromium-1228/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';

const SIZES = [[1440, 900], [1440, 700], [1440, 1100], [1280, 900], [1728, 900]];

const probe = () => {
  const find = (txt) => [...document.querySelectorAll('*')].find(el => {
    const t = [...el.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join('').trim();
    const r = el.getBoundingClientRect();
    return t.replace(/█/g, '').trim() === txt && r.width > 1;
  });
  const box = (el) => {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    return [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height), s.fontSize];
  };
  const hero = document.querySelector('.common-slideshow .center-image');
  const zc = document.querySelector('.page-content-container');
  return {
    vw: document.documentElement.clientWidth,
    vh: document.documentElement.clientHeight,
    docH: document.body.scrollHeight,
    zoom: zc ? getComputedStyle(zc).zoom : null,
    container: zc ? (r => [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)])(zc.getBoundingClientRect()) : null,
    containerBox: zc ? [zc.offsetWidth, zc.offsetHeight] : null,
    hero: hero ? (r => [Math.round(r.left * 10) / 10, Math.round(r.top * 10) / 10,
                        Math.round(r.width), Math.round(r.height)])(hero.getBoundingClientRect()) : null,
    event: box(find('Event')),
    planetblu: box(find('Planet BLU'))
  };
};

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: EXE });
  for (const [w, h] of SIZES) {
    const page = await browser.newPage();
    await page.setViewportSize({ width: w, height: h });
    await page.goto('https://readymag.website/u1457614830/6477513/', { waitUntil: 'load' });
    await page.waitForTimeout(5000);
    const d = await page.$('#CybotCookiebotDialogBodyButtonDecline');
    if (d) { await d.click(); await page.waitForTimeout(800); }
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(1200);
    console.log(w + 'x' + h, JSON.stringify(await page.evaluate(probe)));
    await page.close();
  }
  await browser.close();
})();
