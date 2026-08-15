/* Đo một trang của bản gốc planetBLU: gán khoá cho từng phần tử, ghi lại chữ ký,
   thứ tự xếp lớp, và quỹ đạo (vị trí/kích thước/độ mờ) tại từng mốc cuộn 50px.

   Chạy:
     node tools/measure.js                          → trang chính, ghi measured.json
     node tools/measure.js <đường-dẫn> <tên>         → trang con, ghi measured-<tên>.json
   Ví dụ: node tools/measure.js 6473183/ hoavarac

   Trang chính cuộn bằng cửa sổ, các trang con cuộn nội bộ trong khung của Readymag —
   script tự nhận ra và dùng đúng cách. */
const path = require('path');
const fs = require('fs');
const { chromium } = require(process.env.PW ||
  '/Users/Apple/.npm/_npx/9873c18b2d85bc59/node_modules/playwright'.replace('9873', '9833'));

const SITE = 'https://readymag.website/u1457614830/';
const SLUG = process.argv[2] || '6477513/';
const NAME = process.argv[3] || '';
// Bản gốc có hai bố cục: canvas 1024×608 cho máy tính, 320×568 cho điện thoại.
// Nó chọn theo thiết bị, và chỉ đổi sang bố cục điện thoại khi màn hẹp hơn 640px.
const MOBILE = process.argv[4] === 'mobile';
const VIEW = MOBILE ? { width: 375, height: 812 } : { width: 1440, height: 900 };
const UA_MOBILE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) ' +
  'AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
const URL = SITE + SLUG;
const TEN = (MOBILE ? 'mobile' : '') + (NAME ? (MOBILE ? '-' : '') + NAME : '');
const OUT = path.join(__dirname, '..', TEN ? `measured-${TEN}.json` : 'measured.json');
const STEP = 50;

const HESO_ANH = MOBILE ? 375 / 320 : 1440 / 1024;

(async () => {
  // dùng đúng bản Chromium đã tải sẵn trong máy
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.HOME +
      '/Library/Caches/ms-playwright/chromium-1228/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'
  });
  const ctx = await browser.newContext(MOBILE
    ? { viewport: VIEW, isMobile: true, hasTouch: true, deviceScaleFactor: 2, userAgent: UA_MOBILE }
    : { viewport: VIEW });
  const page = await ctx.newPage();
  await page.goto(URL, { waitUntil: 'load' });
  await page.waitForTimeout(5000);

  const decline = await page.$('#CybotCookiebotDialogBodyButtonDecline');
  if (decline) { await decline.click(); await page.waitForTimeout(800); }

  // Trang có nhiều khung trùng tên, phần lớn rỗng — hàm này chọn đúng khung đang
  // cuộn nội dung. Cài sẵn vào trang để mọi phép đo sau đều gọi được.
  await page.addInitScript(() => { /* giữ chỗ cho lần điều hướng sau */ });
  const CAI_HAM = () => {
    window.timKhungCuon = function () {
      let best = null;
      document.querySelectorAll('.content-scroll-wrapper, [class*=scroll]').forEach(el => {
        if (el.clientHeight < 100) return;
        if (el.scrollHeight <= el.clientHeight + 4) return;
        if (!best || el.scrollHeight > best.scrollHeight) best = el;
      });
      return best;
    };
  };
  await page.evaluate(CAI_HAM);

  // Làm nóng: Readymag chỉ dựng đủ nội dung sau khi người xem cuộn thật, và chỉ
  // hưởng ứng bánh xe chuột chứ không hưởng ứng việc gán scrollTop.
  // Trang co lại khi quay về đầu, nên ghi luôn chiều cao lớn nhất bắt gặp.
  let capNhat = 0;
  const doCao = () => page.evaluate(() => {
    if (!window.timKhungCuon) return 0;
    const w = timKhungCuon();
    const trong = document.body.scrollHeight > innerHeight + 2;
    return Math.max(
      trong ? document.body.scrollHeight : 0,
      w ? w.scrollTop + w.clientHeight : 0,
      w ? w.scrollHeight : 0
    );
  });

  await page.mouse.move(VIEW.width / 2, VIEW.height / 2);
  for (let i = 0; i < 30; i++) {
    await page.mouse.wheel(0, 600);
    await page.waitForTimeout(140);
    capNhat = Math.max(capNhat, await doCao());
  }
  await page.waitForTimeout(1200);
  for (let i = 0; i < 30; i++) {
    await page.mouse.wheel(0, -600);
    await page.waitForTimeout(120);
  }
  await page.waitForTimeout(1500);

  const base = await page.evaluate(() => {
    let n = 0;
    document.querySelectorAll('main *').forEach(el => {
      const s = getComputedStyle(el);
      const own = [...el.childNodes].filter(x => x.nodeType === 3).map(x => x.textContent).join('').trim();
      const isImg = el.tagName === 'IMG';
      const isVideo = el.tagName === 'VIDEO';
      const hasBg = s.backgroundImage.includes('rmcdn');
      // Readymag vẽ đường kẻ và mũi tên của biểu mẫu bằng SVG, nút bằng khối nền đặc
      const isSvg = el.tagName === 'svg';
      const r0 = el.getBoundingClientRect();
      const nenDac = s.backgroundColor !== 'rgba(0, 0, 0, 0)' && s.backgroundColor !== 'transparent'
        && s.backgroundColor !== 'rgb(255, 255, 255)' && r0.width > 8 && r0.height > 8;
      if (!own && !isImg && !isVideo && !hasBg && !isSvg && !nenDac) return;
      if (el.tagName === 'STYLE' || el.tagName === 'SCRIPT') return;
      if (el.closest('svg') && !isSvg) return;   // chỉ giữ thẻ svg ngoài cùng
      el.setAttribute('data-k', 'k' + (n++));
    });
    const sig = {}, stack = {}, style = {};
    let order = 0;
    document.querySelectorAll('main [data-k]').forEach(el => {
      const s = getComputedStyle(el);
      const own = [...el.childNodes].filter(x => x.nodeType === 3).map(x => x.textContent).join('');
      const bg = s.backgroundImage;
      const isImg = el.tagName === 'IMG';
      const isVideo = el.tagName === 'VIDEO';
      const poster = isVideo ? (el.getAttribute('poster') || '') : '';
      const src = isImg ? el.currentSrc
        : isVideo ? poster
        : (bg.match(/url\("([^"]+)"\)/) || [])[1] || '';
      sig[el.dataset.k] = [el.tagName, own.trim().slice(0, 40), (src.match(/image-[a-f0-9-]+/) || [''])[0]];
      let z = 0, p = el;
      while (p) { const v = getComputedStyle(p).zIndex; if (v !== 'auto') { z = parseInt(v, 10); break; } p = p.parentElement; }
      stack[el.dataset.k] = [z, order++];
      style[el.dataset.k] = {
        tag: el.tagName, text: own, inner: el.innerHTML.length < 3000 ? el.innerHTML : null,
        svg: el.tagName === 'svg' && el.outerHTML.length < 4000 ? el.outerHTML : null,
        svgNet: el.tagName === 'svg'
          ? [...el.querySelectorAll('path, rect, circle, polygon')].slice(0, 8).map(q => {
              const qs = getComputedStyle(q);
              return [qs.fill, qs.stroke, qs.strokeWidth];
            })
          : null,
        // Readymag hay lật/xoay hình bằng transform đặt ở widget bọc ngoài
        xoay: (() => {
          for (let q = el; q && q !== document.body; q = q.parentElement) {
            const t = getComputedStyle(q).transform;
            if (!t || t === 'none') continue;
            const m = t.match(/matrix\(([^)]+)\)/);
            if (!m) return t;
            const v = m[1].split(',').map(Number);
            // Chỉ phóng đều, không nghiêng, không lật: đây là lớp phóng của bản gốc
            // chứ không phải phép xoay. Nhận nhầm nó là chữ bị phóng thêm một lần nữa.
            const chiPhong = v[1] === 0 && v[2] === 0 && v[0] === v[3] && v[0] > 0;
            if (!chiPhong) return t;
          }
          return null;
        })(),
        // video: giữ mã để nối với tệp đã tải về, và poster để hiện trước khi phát
        video: isVideo ? ((poster.match(/\/([A-Za-z0-9_-]{10,})\/poster\.jpg/) || [])[1] || '') : null,
        src: src || null, isBg: !isImg && bg.includes('rmcdn'),
        bgSize: s.backgroundSize, bgPos: s.backgroundPosition, objFit: isImg ? s.objectFit : null,
        fs: s.fontSize, fw: s.fontWeight, lh: s.lineHeight, ls: s.letterSpacing, ff: s.fontFamily,
        color: s.color, bgc: s.backgroundColor, ta: s.textAlign, td: s.textDecorationLine,
        z: s.zIndex, wsp: s.whiteSpace,
        href: el.closest('a') ? el.closest('a').getAttribute('href') : null,
        parents: (() => { const c = []; let q = el.parentElement;
          while (q) { if (q.dataset && q.dataset.k) c.push(q.dataset.k); q = q.parentElement; } return c; })(),
        // trang (article) chứa phần tử — mỗi trang có khung cắt riêng khi trượt
        page: (() => { const a = el.closest('article');
          return a ? [...document.querySelectorAll('main article')].indexOf(a) : -1; })()
      };
    });
    // Trang chính cuộn bằng cửa sổ; các trang con cuộn nội bộ trong khung riêng.
    const wrap = timKhungCuon();
    const noiBo = document.body.scrollHeight <= innerHeight + 2 && wrap;
    return {
      n, sig, stack, style,
      cuonNoiBo: !!noiBo,
      docH: noiBo ? wrap.scrollHeight : document.body.scrollHeight
    };
  });

  // dùng chiều cao lớn nhất bắt gặp lúc làm nóng nếu nó lớn hơn
  if (capNhat > base.docH) base.docH = capNhat;

  // hàm cuộn dùng chung cho cả hai kiểu
  const scrollTo = (y) => page.evaluate(([v, noiBo]) => {
    if (noiBo) {
      const w = timKhungCuon();
      if (w) w.scrollTop = v;
    } else {
      window.scrollTo(0, v);
    }
  }, [y, base.cuonNoiBo]);
  const scrollNow = () => page.evaluate((noiBo) => {
    const w = timKhungCuon();
    return Math.round(noiBo && w ? w.scrollTop : window.scrollY);
  }, base.cuonNoiBo);

  console.log('phần tử:', base.n, '| chiều cao nội dung:', base.docH,
              '| cuộn', base.cuonNoiBo ? 'nội bộ' : 'cửa sổ');

  // Hệ số quy đổi DOM -> màn hình. Chỉ đáng tin khi phần tử đang nằm trong
  // khung nhìn, nên đo dần trong lúc cuộn thay vì đo hết một lượt ở đầu trang.
  const factors = {};
  const grabFactor = async (k) => {
    if (factors[k]) return;
    const loc = page.locator(`[data-k="${k}"]`).first();
    const box = await loc.boundingBox().catch(() => null);
    if (!box || box.width < 1) return;
    const dom = await loc.evaluate(el => {
      const r = el.getBoundingClientRect();
      return [r.left, r.top, r.width, r.height];
    }).catch(() => null);
    if (!dom || dom[2] < 1) return;
    factors[k] = Math.round((box.width / dom[2]) * 10000) / 10000;
  };

  // ngắt dòng thật của từng khối chữ
  const lines = {};
  // quỹ đạo
  const frames = [];
  const maxY = base.docH - VIEW.height;
  // Ngoài các mốc cách đều, phải ghi thêm đúng đáy trang: nếu bỏ, phần tử đứng
  // yên ở đoạn cuối và cả trang lệch mấy chục pixel so với bản gốc khi cuộn hết.
  const mocs = [];
  for (let y = 0; y <= maxY; y += STEP) mocs.push(y);
  if (mocs[mocs.length - 1] !== maxY) mocs.push(maxY);
  for (const y of mocs) {
    await scrollTo(y);
    await page.waitForTimeout(1300);
    // Ghi khung của mọi phần tử đang hiện, kèm kết quả dò điểm để biết phần tử
    // có thực sự nằm trên màn hình hay đã bị khung của trang cắt mất. Dò điểm
    // dùng toạ độ thật (đã nhân hệ số) nên đúng cả với các lớp có zoom —
    // IntersectionObserver thì báo sai ở những lớp này.
    const f = await page.evaluate((HESO) => {
      const items = {};
      document.querySelectorAll('main [data-k]').forEach(el => {
        const s = getComputedStyle(el);
        // giữ cả phần tử đang trong suốt: có những ảnh chỉ hiện khi rê chuột,
        // vẫn cần biết chúng nằm ở đâu
        if (s.visibility === 'hidden' || s.display === 'none') return;
        const r = el.getBoundingClientRect();
        if (r.width < 0.5 || r.height < 0.5) return;

        const isImg = el.tagName === 'IMG';
        const f = (isImg || el.tagName === 'VIDEO' || s.backgroundImage.includes('rmcdn')) ? HESO : 1;
        // dò trong phần giao giữa phần tử và màn hình, nên vẫn kiểm được cả
        // những phần tử chỉ ló ra một góc
        const L = Math.max(2, r.left * f), T = Math.max(2, r.top * f);
        const R = Math.min(innerWidth - 2, (r.left + r.width) * f);
        const B = Math.min(innerHeight - 2, (r.top + r.height) * f);
        let seen = 0, tried = 0;
        if (R > L && B > T) {
          for (const [ax, ay] of [[.5, .5], [.2, .2], [.8, .2], [.2, .8], [.8, .8]]) {
            tried++;
            if (document.elementsFromPoint(L + (R - L) * ax, T + (B - T) * ay).indexOf(el) >= 0) {
              seen = 1;
              break;
            }
          }
        }
        items[el.dataset.k] = [Math.round(r.left * 10) / 10, Math.round(r.top * 10) / 10,
                               Math.round(r.width * 10) / 10, Math.round(r.height * 10) / 10,
                               Math.round(parseFloat(s.opacity) * 100) / 100,
                               tried ? seen : -1];   // -1: mọi điểm dò đều ngoài màn hình
      });
      return { items, path: location.pathname };
    }, HESO_ANH);
    f.y = await scrollNow();
    frames.push(f);

    // đo hệ số cho những phần tử đang hiện rõ trong khung nhìn
    for (const k of Object.keys(f.items)) {
      const v = f.items[k];
      if (factors[k]) continue;
      if (v[1] < -50 || v[1] + v[3] > VIEW.height + 50) continue;
      await grabFactor(k);
    }

    // tranh thủ lấy ngắt dòng cho khối chữ đang hiện
    const ls = await page.evaluate((known) => {
      const out = {};
      document.querySelectorAll('main [data-k]').forEach(el => {
        const k = el.dataset.k;
        if (known.indexOf(k) >= 0) return;
        const tn = [...el.childNodes].find(x => x.nodeType === 3 && x.textContent.trim());
        if (!tn) return;
        const r = el.getBoundingClientRect();
        if (r.width < 1 || r.height < 1) return;
        const txt = tn.textContent;
        const rg = document.createRange();
        const arr = []; let start = 0, prevTop = null;
        for (let i = 1; i <= txt.length; i++) {
          rg.setStart(tn, i - 1); rg.setEnd(tn, i);
          const rc = rg.getBoundingClientRect();
          if (rc.width === 0 && rc.height === 0) continue;
          if (prevTop === null) prevTop = rc.top;
          else if (Math.abs(rc.top - prevTop) > 3) { arr.push(txt.slice(start, i - 1)); start = i - 1; prevTop = rc.top; }
        }
        arr.push(txt.slice(start));
        if (arr.length > 1) out[k] = arr;
      });
      return out;
    }, Object.keys(lines));
    Object.assign(lines, ls);

    if (y % 500 === 0) console.log('  mốc', y, '/', maxY);
  }

  fs.writeFileSync(OUT, JSON.stringify({ base, factors, lines, frames }));
  console.log('đã ghi', OUT, (fs.statSync(OUT).size / 1024 / 1024).toFixed(1), 'MB',
              '| mốc:', frames.length, '| khối chữ nhiều dòng:', Object.keys(lines).length);
  await browser.close();
})();
