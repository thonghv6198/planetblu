/* Đo chi tiết hiệu ứng khi rê chuột trên bản gốc: phần tử nào đổi, đổi thế nào.
   Chạy: node tools/hover.js */
const { chromium } = require(process.env.PW ||
  '/Users/Apple/.npm/_npx/9833c18b2d85bc59/node_modules/playwright');

const EXE = process.env.HOME +
  '/Library/Caches/ms-playwright/chromium-1228/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';

// chụp trạng thái mọi phần tử đang hiện, để so trước/sau khi rê chuột
const state = () => {
  const out = {};
  document.querySelectorAll('main *').forEach((el, i) => {
    const s = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return;
    if (r.bottom < 0 || r.top > innerHeight) return;
    const own = [...el.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join('').trim();
    const src = el.tagName === 'IMG' ? el.currentSrc : s.backgroundImage;
    out['i' + i] = {
      t: own.slice(0, 24),
      a: (String(src).match(/image-[a-f0-9]{8}/) || [''])[0],
      r: [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)],
      o: s.opacity, c: s.color, bg: s.backgroundColor, td: s.textDecorationLine,
      tr: s.transform === 'none' ? '' : s.transform, f: s.filter
    };
  });
  return out;
};

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: EXE });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('https://readymag.website/u1457614830/6477513/', { waitUntil: 'load' });
  await page.waitForTimeout(5000);
  const d = await page.$('#CybotCookiebotDialogBodyButtonDecline');
  if (d) { await d.click(); await page.waitForTimeout(800); }

  const SPOTS = [
    ['dòng sự kiện 1', 900, 380, 150],
    ['dòng sự kiện 2', 900, 380, 370],
    ['nút More', 900, 130, 640],
    ['ảnh trong lưới', 2300, 600, 200],
    ['chữ Instagram', 5400, 1080, 320]
  ];

  for (const [name, scroll, x, y] of SPOTS) {
    await page.evaluate(v => window.scrollTo(0, v), scroll);
    await page.waitForTimeout(2000);
    await page.mouse.move(720, 860);
    await page.waitForTimeout(600);
    const before = await page.evaluate(state);
    await page.mouse.move(x, y);
    await page.waitForTimeout(900);
    const after = await page.evaluate(state);

    const changes = [];
    const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
    for (const k of keys) {
      const a = before[k], b = after[k];
      if (!a && b) { changes.push('HIỆN THÊM ' + JSON.stringify(b)); continue; }
      if (a && !b) { changes.push('BIẾN MẤT ' + JSON.stringify(a)); continue; }
      for (const p of ['o', 'c', 'bg', 'td', 'tr', 'f', 'a']) {
        if (a[p] !== b[p]) changes.push(`${a.t || a.a || k}: ${p} ${a[p]} → ${b[p]}`);
      }
      if (a.r.join() !== b.r.join()) changes.push(`${a.t || a.a || k}: khung ${a.r} → ${b.r}`);
    }
    console.log('\n### rê vào ' + name + ' (cuộn ' + scroll + ')');
    if (!changes.length) console.log('  (không đổi gì)');
    else changes.slice(0, 12).forEach(c => console.log('  ' + c));
    if (changes.length > 12) console.log('  … và ' + (changes.length - 12) + ' thay đổi nữa');
  }
  await browser.close();
})();
