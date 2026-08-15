/* Kiểm tra các liên kết đã đi thẳng trong bản dựng lại chưa (không mở bản gốc),
   và các trang con có tải đủ ảnh không.
   Chạy: node tools/check-links.js */
const { chromium } = require(process.env.PW ||
  '/Users/Apple/.npm/_npx/9833c18b2d85bc59/node_modules/playwright');

const EXE = process.env.HOME +
  '/Library/Caches/ms-playwright/chromium-1228/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const HOST = 'http://127.0.0.1:8811/';

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: EXE });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });

  // rê vào Project rồi bấm mục "Hoa và Rác"
  await page.goto(HOST + 'index.html', { waitUntil: 'load' });
  await page.waitForTimeout(2200);
  await page.mouse.move(145, 14);
  await page.waitForTimeout(600);
  await page.mouse.click(145, 27);
  await page.waitForTimeout(1800);
  console.log('menu "Hoa và Rác" →', page.url().replace(HOST, '/'));

  // nút More ở phần Event
  await page.goto(HOST + 'index.html', { waitUntil: 'load' });
  await page.waitForTimeout(2200);
  await page.evaluate(() => window.scrollTo(0, 900));
  await page.waitForTimeout(1200);
  const more = await page.evaluate(() => {
    const el = [...document.querySelectorAll('.el.txt')].find(e => /More/.test(e.textContent));
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return [Math.round(r.left + r.width / 2), Math.round(r.top + r.height / 2)];
  });
  if (more) {
    await page.mouse.click(more[0], more[1]);
    await page.waitForTimeout(1800);
    console.log('nút "More" phần Event →', page.url().replace(HOST, '/'));
  } else {
    console.log('nút "More" phần Event → không tìm thấy');
  }

  // các mục trên thanh điều hướng
  // Bấm theo tên mục chứ không theo toạ độ cứng: header đổi chiều cao hay cỡ
  // chữ thì phép thử vẫn đúng.
  for (const ten of ['Event', 'Archive', 'Visit']) {
    await page.goto(HOST + 'index.html', { waitUntil: 'load' });
    await page.waitForTimeout(2000);
    await page.evaluate((nhan) => {
      const m = [...document.querySelectorAll('#topbar .el')]
        .find(e => (e.textContent || '').replace(/█/g, '').trim() === nhan);
      if (m) m.click();
    }, ten);
    await page.waitForTimeout(1600);
    console.log(('menu "' + ten + '"').padEnd(22), '→', page.url().replace(HOST, '/'));
  }

  // các trang con tải đủ ảnh chưa
  for (const p of ['hoavarac', 'event', 'archive', 'visit']) {
    await page.goto(HOST + p + '.html', { waitUntil: 'load' });
    await page.waitForTimeout(2500);
    const r = await page.evaluate(() => ({
      anh: document.querySelectorAll('#stage img, #stage .bg').length,
      hong: [...document.querySelectorAll('#stage img')]
        .filter(i => i.complete && i.naturalWidth === 0).length,
      chu: document.querySelectorAll('#stage .txt').length
    }));
    console.log(('trang ' + p + '.html').padEnd(22), 'ảnh', String(r.anh).padStart(3),
                '| hỏng', r.hong, '| khối chữ', r.chu);
  }
  await browser.close();
})();
