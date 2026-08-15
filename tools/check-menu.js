/* Kiểm tra menu con mở được ở mọi vị trí cuộn.
   Chạy: node tools/check-menu.js */
const { chromium } = require(process.env.PW ||
  '/Users/Apple/.npm/_npx/9833c18b2d85bc59/node_modules/playwright');

const EXE = process.env.HOME +
  '/Library/Caches/ms-playwright/chromium-1228/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';

const TEN_MUC = ['Project', 'Archive', 'Visit', 'EN', 'Planet BLU'];
const MARKS = [0, 900, 1800, 2300, 3200, 4200, 5200, 5641];

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: EXE });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('http://127.0.0.1:8811/index.html', { waitUntil: 'load' });
  await page.waitForTimeout(2000);

  let bad = 0;
  // Mục nào có menu con là do config.js quyết định — đọc thẳng từ đó để phép thử
  // không đòi hỏi những mục mà dự án đã cố ý bỏ.
  const coMenu = await page.evaluate(() => {
    const s = new Set();
    ((window.PB_CFG || {}).menuXo || []).forEach(d => (d.under || []).forEach(n => s.add(n)));
    return [...s];
  });
  const ITEMS = coMenu.filter(n => TEN_MUC.includes(n));
  console.log('mục có menu con:', ITEMS.join(', '));

  for (const y of MARKS) {
    await page.evaluate(v => window.scrollTo(0, v), y);
    await page.waitForTimeout(700);
    const row = [];
    for (const name of ITEMS) {
      // Tìm mục theo tên rồi rê vào chính giữa nó: header đổi chiều cao, cỡ chữ
      // hay vị trí (ví dụ dịch sang nhường chỗ cho logo) thì phép thử vẫn đúng.
      const tam = await page.evaluate((nhan) => {
        const m = [...document.querySelectorAll('#topbar .el')]
          .find(e => (e.textContent || '').replace(/█/g, '').trim() === nhan);
        if (!m) return null;
        const r = m.getBoundingClientRect();
        return [r.left + r.width / 2, r.top + r.height / 2];
      }, name);
      if (!tam) { row.push(name + ':x'); bad++; continue; }
      await page.mouse.move(700, 500);
      // Menu nán lại 700ms sau khi rời chuột (để người xem kịp rê xuống mục con),
      // nên phải chờ lâu hơn thế, không thì đếm lẫn cả menu của mục vừa thử.
      await page.waitForTimeout(900);
      await page.mouse.move(tam[0], tam[1]);
      await page.waitForTimeout(400);
      const n = await page.evaluate(() => document.querySelectorAll('.drop.open').length);
      row.push(name + ':' + n);
      if (n === 0) bad++;
    }
    console.log('cuộn ' + String(y).padEnd(6) + row.join('  '));
  }
  console.log(bad ? '=> còn ' + bad + ' chỗ không mở được' : '=> mọi mục đều mở được');
  await browser.close();
})();
