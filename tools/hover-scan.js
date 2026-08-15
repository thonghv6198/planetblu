/* Dò xem khối chữ nào của bản gốc đổi diện mạo khi rê chuột vào.

   Cách làm: lấy khung của từng khối chữ từ số liệu đã đo, mở bản gốc, chụp vùng
   đó lúc chuột ở xa rồi chụp lại lúc chuột đặt lên khối — khác nhau tức là khối
   ấy có hiệu ứng rê chuột.

   Chạy: node tools/hover-scan.js <slug bản gốc> [tên trang]
   Kết quả: hover-<tên>.json  →  { "k12": true, ... }
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
const OUT = path.join(ROOT, NAME ? `hover-${NAME}.json` : 'hover.json');
const VIEW = { width: 1440, height: 900 };

if (!SLUG) { console.error('thiếu slug bản gốc'); process.exit(1); }

(async () => {
  const M = JSON.parse(fs.readFileSync(SRC, 'utf8'));
  const style = M.base.style;
  const frame0 = M.frames[0].items;

  // khối chữ đang hiện ở màn hình đầu tiên
  const ung = [];
  for (const [k, v] of Object.entries(frame0)) {
    const n = style[k];
    if (!n || !(n.text || '').trim()) continue;
    if (n.tag === 'IMG' || n.tag === 'VIDEO' || n.tag === 'svg' || n.isBg) continue;
    const [x, y, w, h] = v;
    if (w < 4 || h < 4 || x < 0 || y < 0 || x + w > VIEW.width || y + h > VIEW.height) continue;
    ung.push({ k, x, y, w, h, chu: (n.text || '').trim().slice(0, 24) });
  }
  console.log('khối chữ để thử:', ung.length);

  const browser = await chromium.launch({ executablePath: EXE });
  const page = await browser.newPage({ viewport: VIEW });
  await page.goto(`https://readymag.website/u1457614830/${SLUG}`,
                  { waitUntil: 'networkidle' }).catch(() => {});
  await page.waitForTimeout(4000);

  const xa = async () => { await page.mouse.move(1430, 880); await page.waitForTimeout(400); };
  const chup = (o) => page.screenshot({
    clip: { x: Math.max(0, o.x - 2), y: Math.max(0, o.y - 2), width: o.w + 4, height: o.h + 4 }
  });

  const ket = {};
  for (const o of ung) {
    await xa();
    const truoc = await chup(o);
    await page.mouse.move(o.x + o.w / 2, o.y + o.h / 2);
    await page.waitForTimeout(500);
    const sau = await chup(o);
    if (!truoc.equals(sau)) {
      ket[o.k] = true;
      console.log('  có hiệu ứng:', o.k, '|', o.chu);
    }
  }

  await browser.close();
  fs.writeFileSync(OUT, JSON.stringify(ket));
  console.log('khối có hiệu ứng rê chuột:', Object.keys(ket).length, '→', path.basename(OUT));
})();
