/* Đo khoảng cách từ ô vuông ██ tới mép phải khối chữ, trên chính bản gốc.

   Bản gốc chèn khoảng trắng sau ô vuông để đẩy nó vào đúng cột. Dựng lại bằng
   khoảng trắng thì lệch nửa pixel mỗi dấu cách (metric không trùng tuyệt đối),
   nên thay vì mô phỏng, ta đo luôn khoảng cách ấy rồi ép bằng padding.

   Chạy: node tools/box-scan.js <slug bản gốc> [tên trang]
   Kết quả: box-<tên>.json → { "k0": 8.2, ... }  (đơn vị: pixel màn hình)
*/
const path = require('path');
const fs = require('fs');
const { chromium } = require(process.env.HOME +
  '/.npm/_npx/9833c18b2d85bc59/node_modules/playwright');

const EXE = process.env.HOME +
  '/Library/Caches/ms-playwright/chromium-1228/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';

const SLUG = process.argv[2];
const NAME = process.argv[3] || '';
const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, NAME ? `measured-${NAME}.json` : 'measured.json');
const OUT = path.join(ROOT, NAME ? `box-${NAME}.json` : 'box.json');
const VIEW = { width: 1440, height: 900 };

if (!SLUG) { console.error('thiếu slug bản gốc'); process.exit(1); }

(async () => {
  const M = JSON.parse(fs.readFileSync(SRC, 'utf8'));
  const style = M.base.style;

  // khối chữ có ô vuông và kết thúc bằng khoảng trắng — chỉ những khối này lệch
  const can = {};
  for (const [k, n] of Object.entries(style)) {
    const t = n.text || '';
    if (!t.includes('█') || !/[ ]+$/.test(t)) continue;
    can[k] = t;
  }
  console.log('khối cần đo:', Object.keys(can).length);
  if (!Object.keys(can).length) { fs.writeFileSync(OUT, '{}'); return; }

  const browser = await chromium.launch({ executablePath: EXE });
  const page = await browser.newPage({ viewport: VIEW });
  await page.goto(`https://readymag.website/u1457614830/${SLUG}`,
                  { waitUntil: 'networkidle' }).catch(() => {});
  await page.waitForTimeout(4000);

  // Khớp theo nội dung: khoá k của bản đo và DOM của bản gốc là cùng một trang,
  // nhưng ta không gắn được data-k ở đây nên tìm theo đúng chuỗi chữ.
  const doDac = await page.evaluate((canhs) => {
    const ket = {};
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let n; (n = w.nextNode());) {
      const t = n.textContent || '';
      const i = t.indexOf('█');
      if (i < 0) continue;
      const oKhoi = n.parentElement && n.parentElement.closest('[class*=widget], div');
      const rg = document.createRange();
      rg.setStart(n, i); rg.setEnd(n, i + 1);
      const o = rg.getBoundingClientRect();
      if (o.width < 1) continue;
      // mép phải của khối chữ: lấy phần tử cha gần nhất có bề rộng lớn hơn chữ
      let p = n.parentElement, khoi = null;
      while (p && p !== document.body) {
        const r = p.getBoundingClientRect();
        if (r.width >= o.width) { khoi = r; break; }
        p = p.parentElement;
      }
      if (!khoi) continue;
      for (const [k, chu] of Object.entries(canhs)) {
        if (chu !== t) continue;
        ket[k] = Math.round((khoi.right - o.right) * 100) / 100;
      }
    }
    return ket;
  }, can);

  await browser.close();
  fs.writeFileSync(OUT, JSON.stringify(doDac));
  console.log('đo được:', Object.keys(doDac).length, '→', path.basename(OUT));
  for (const [k, v] of Object.entries(doDac)) {
    console.log('  %s  cách mép phải %s px  |  %s', k, v, JSON.stringify(can[k]));
  }
})();
