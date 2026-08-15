/* Dò hành vi menu của bản gốc: rê chuột và bấm vào từng mục trên thanh điều hướng,
   ghi lại phần tử nào hiện ra, ở đâu, và dẫn đi đâu.
   Chạy: node tools/menu.js → in kết quả, ghi menu.json */
const path = require('path');
const fs = require('fs');
const { chromium } = require(process.env.PW ||
  '/Users/Apple/.npm/_npx/9833c18b2d85bc59/node_modules/playwright');

const EXE = process.env.HOME +
  '/Library/Caches/ms-playwright/chromium-1228/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';

const snap = () => {
  const out = [];
  document.querySelectorAll('body *').forEach(el => {
    const s = getComputedStyle(el);
    const own = [...el.childNodes].filter(x => x.nodeType === 3).map(x => x.textContent).join('').trim();
    if (!own) return;
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return;
    if (s.visibility === 'hidden' || parseFloat(s.opacity) < 0.05 || s.display === 'none') return;
    if (r.top > 200) return;                       // chỉ quan tâm vùng thanh điều hướng
    const a = el.closest('a');
    out.push({
      text: own.slice(0, 40),
      rect: [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)],
      fs: s.fontSize, op: s.opacity,
      href: a ? a.getAttribute('href') : null
    });
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

  const result = { base: await page.evaluate(snap), hovers: {}, clicks: {} };

  const targets = [
    ['Event', 45, 14], ['Project', 145, 14], ['Archive', 243, 14],
    ['Visit', 340, 14], ['About us', 440, 14], ['EN', 1285, 14], ['Planet BLU', 1370, 14]
  ];

  for (const [name, x, y] of targets) {
    await page.mouse.move(700, 500);
    await page.waitForTimeout(400);
    await page.mouse.move(x, y);
    await page.waitForTimeout(900);
    result.hovers[name] = await page.evaluate(snap);
    await page.screenshot({ path: path.join(__dirname, '..', 'shots', 'orig-hover-' + name.replace(/\s/g, '') + '.jpeg'),
                            type: 'jpeg', quality: 85, clip: { x: 0, y: 0, width: 1440, height: 260 } });
  }

  fs.writeFileSync(path.join(__dirname, '..', 'menu.json'), JSON.stringify(result, null, 1));

  const names = t => t.map(i => i.text + '@' + i.rect[0] + ',' + i.rect[1]).join(' | ');
  console.log('MẶC ĐỊNH:', names(result.base));
  for (const k of Object.keys(result.hovers)) {
    const extra = result.hovers[k].filter(i => !result.base.some(b => b.text === i.text && b.rect[0] === i.rect[0]));
    console.log('HOVER', k, '=>', extra.length ? names(extra) : '(không có gì mới)');
  }
  await browser.close();
})();
