/* Soi các hiệu ứng của bản gốc mà bản dựng lại có thể còn thiếu:
   - phần tử nào đổi hình khi rê chuột vào (ảnh, chữ, nút)
   - trang có hiệu ứng lúc vừa tải không
   - slideshow có tự chạy không, và bấm/kéo có chuyển ảnh không
   Chạy: node tools/effects.js [orig|mine] */
const { chromium } = require(process.env.PW ||
  '/Users/Apple/.npm/_npx/9833c18b2d85bc59/node_modules/playwright');

const EXE = process.env.HOME +
  '/Library/Caches/ms-playwright/chromium-1228/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';

const WHICH = process.argv[2] || 'orig';
const URL = WHICH === 'orig'
  ? 'https://readymag.website/u1457614830/6477513/'
  : 'http://127.0.0.1:8811/index.html';

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: EXE });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });

  // hiệu ứng lúc vừa tải: chụp liên tiếp ngay sau khi trang hiện ra
  await page.goto(URL, { waitUntil: 'domcontentloaded' });
  const early = [];
  for (let i = 0; i < 6; i++) {
    await page.waitForTimeout(400);
    early.push(await page.screenshot({ clip: { x: 0, y: 0, width: 700, height: 500 } }));
  }
  const changing = early.slice(1).filter((b, i) => !b.equals(early[i])).length;
  console.log(WHICH, '| khung hình đổi trong 2,4 giây đầu:', changing, '/ 5');

  if (WHICH === 'orig') {
    const d = await page.$('#CybotCookiebotDialogBodyButtonDecline');
    if (d) { await d.click(); await page.waitForTimeout(800); }
  }
  await page.waitForTimeout(2500);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(1200);

  // slideshow có tự chạy trong 15 giây không
  const a = await page.screenshot({ clip: { x: 200, y: 200, width: 500, height: 300 } });
  await page.waitForTimeout(15000);
  const b = await page.screenshot({ clip: { x: 200, y: 200, width: 500, height: 300 } });
  console.log(WHICH, '| ảnh lớn tự đổi sau 15 giây:', !a.equals(b));

  // bấm vào ảnh lớn có chuyển ảnh không
  const c1 = await page.screenshot({ clip: { x: 200, y: 200, width: 500, height: 300 } });
  await page.mouse.click(720, 400);
  await page.waitForTimeout(1200);
  const c2 = await page.screenshot({ clip: { x: 200, y: 200, width: 500, height: 300 } });
  console.log(WHICH, '| bấm vào ảnh lớn thì đổi ảnh:', !c1.equals(c2));

  // kéo ngang có chuyển ảnh không
  await page.mouse.move(900, 400);
  await page.mouse.down();
  await page.mouse.move(500, 400, { steps: 12 });
  await page.mouse.up();
  await page.waitForTimeout(1200);
  const c3 = await page.screenshot({ clip: { x: 200, y: 200, width: 500, height: 300 } });
  console.log(WHICH, '| kéo ngang thì đổi ảnh:', !c2.equals(c3));

  // rê chuột lên các mục chữ: có đổi hình không
  await page.evaluate(() => window.scrollTo(0, 900));
  await page.waitForTimeout(1500);
  const spots = [['dòng sự kiện', 380, 150], ['đoạn mô tả', 1000, 200], ['nút More', 130, 640]];
  for (const [name, x, y] of spots) {
    await page.mouse.move(720, 850);
    await page.waitForTimeout(400);
    const p1 = await page.screenshot({ clip: { x: Math.max(0, x - 160), y: Math.max(0, y - 40), width: 320, height: 90 } });
    await page.mouse.move(x, y);
    await page.waitForTimeout(700);
    const p2 = await page.screenshot({ clip: { x: Math.max(0, x - 160), y: Math.max(0, y - 40), width: 320, height: 90 } });
    const cur = await page.evaluate(([x, y]) => {
      const el = document.elementFromPoint(x, y);
      return el ? getComputedStyle(el).cursor : null;
    }, [x, y]);
    console.log(WHICH, '| rê vào', name, '- đổi hình:', !p1.equals(p2), '- con trỏ:', cur);
  }

  await browser.close();
})();
