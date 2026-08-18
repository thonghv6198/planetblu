/* planetBLU — dựng lại từ quỹ đạo đo được trên bản gốc.
   Mỗi phần tử có một chuỗi mốc [scrollY, left, top, width, height, opacity] cách nhau 50px.
   Khi cuộn, vị trí được nội suy tuyến tính giữa hai mốc gần nhất, nên chuyển động
   trùng với bản gốc ở mọi vị trí cuộn chứ không chỉ ở các mốc. */
(function () {
  'use strict';

  /* Chọn bố cục đúng như bản gốc: phải VỪA là thiết bị cảm ứng VỪA có cửa sổ hẹp.
     Đo trên bản gốc:
       cửa sổ máy tính thu còn 360px  → vẫn bố cục máy tính, chỉ thu nhỏ lại
       điện thoại dựng đứng (390px)   → bố cục điện thoại
       điện thoại xoay ngang (844px)  → quay về bố cục máy tính
       máy tính bảng (712px trở lên)  → bố cục máy tính
     Nếu chỉ xét bề rộng cửa sổ thì thu hẹp cửa sổ trên máy tính sẽ nhảy nhầm
     sang bố cục điện thoại. */
  function laDienThoai() {
    var camUng = (window.matchMedia && matchMedia('(pointer: coarse)').matches) ||
                 navigator.maxTouchPoints > 0;
    return camUng && window.innerWidth < 640;
  }
  var HEP = laDienThoai();
  var D = (HEP && window.PB_M) ? window.PB_M : (window.PB_D || window.PB_M);
  if (!D) return;
  var stage = document.getElementById('stage');
  // Đánh dấu bố cục đang dùng để CSS bám theo. Không dùng @media theo bề rộng
  // được: thu hẹp cửa sổ máy tính vẫn là bố cục máy tính, phải giữ nguyên kiểu.
  document.documentElement.classList.add(HEP ? 'bocuc-dt' : 'bocuc-mt');
  var spacer = document.getElementById('spacer');

  // Đường dẫn gốc, chốt lại trước khi thay đổi địa chỉ theo phần đang xem —
  // nếu không, ảnh tải muộn sẽ bị tìm trong /event/, /aboutus/… và trả về 404.
  // Mọi trang nằm chung một thư mục nên đường dẫn tài nguyên là tương đối.
  var ROOT = location.href.replace(/[?#].*$/, '').replace(/[^/]*$/, '');
  var url = function (p) { return p && !/^(https?:)?\/\//.test(p) ? ROOT + p : p; };

  /* Mọi thứ phụ thuộc nội dung nằm ở config.js — app.js chỉ là bộ máy chạy.
     Thiếu tệp đó thì dùng giá trị mặc định để trang vẫn hiện được. */
  var CFG = window.PB_CFG || {};
  var TRANG = location.pathname.split('/').pop() || 'index.html';

  /* Lấy phần cấu hình của trang này, theo đúng bố cục đang dùng.

     Mã "kNN" do tools/measure.js đánh riêng cho từng bố cục, nên cùng một mã ở
     bản máy tính và bản điện thoại trỏ vào hai phần tử khác hẳn nhau. Vì vậy
     bản điện thoại chỉ nhận cấu hình khai riêng cho nó ('<trang>@mobile');
     không khai thì bỏ qua, chứ không mượn tạm số của bản máy tính. */
  var theoTrang = function (o) {
    if (!o) return null;
    if (D.mobile) return o[TRANG + '@mobile'] || null;
    return o[TRANG] || null;
  };

  var LOCAL = CFG.trangGoc || {};

  function localPage(href) {
    // Vài chỗ trong bản mẫu còn trỏ về trang soạn thảo của Readymag; đổi thẳng
    // sang trang tương ứng trong bản dựng lại.
    var ng = CFG.trangNgoai || {};
    if (ng[href]) return url(ng[href]);
    var m = String(href).match(new RegExp((CFG.maSo || '') + '\\/(.+)$'));
    if (!m) return null;
    var target = LOCAL[m[1]];
    return target === undefined ? null : url(target);
  }

  // Ngưỡng đổi đường dẫn, đo trên bản gốc
  var ROUTES = D.routes;

  var NAV_ZOOM = CFG.navZoom || 1.4063;
  var DROPS = (CFG.menuXo || []).map(function (d) { return Object.assign({}, d); });
  var PREVIEW = theoTrang(CFG.xemTruoc) || [];
  var CHINH = theoTrang(CFG.chinh) || {};
  var NHAY = theoTrang(CFG.nhay) || {};
  var TRUOT = theoTrang(CFG.truot) || [];
  var LIEN_KET = theoTrang(CFG.lienKet) || {};
  var O_CHON = theoTrang(CFG.oChon) || {};
  var MOT_DONG = theoTrang(CFG.motDong) || [];

  // Thanh điều hướng là một khối header riêng: dải nền trắng cao cố định, các mục
  // canh giữa theo chiều dọc, luôn dính trên cùng.
  var CAO_HEADER = (CFG.header && CFG.header.cao) || 50;
  var LOGO = (CFG.header && CFG.header.logo) || null;
  // Mục nằm bên trái thanh thì dịch sang nhường chỗ cho logo; mục bên phải
  // (EN, Planet BLU) giữ nguyên. Bản điện thoại đặt logo ở mép phải nên nút mở
  // menu giữ nguyên chỗ bên trái, đúng như bản mẫu.
  var DICH_MUC = (LOGO && !D.mobile) ? (LOGO.dichMuc || 0) : 0;
  var MOC_PHAI = (D.baseW || 1440) / 2;
  var PHONG_CHU_NAV = (CFG.header && CFG.header.phongChu) || 1;
  var header = null;      // khối chứa các mục điều hướng
  var yNav = 0;           // toạ độ dọc của mục nav sau khi canh giữa
  var dyNav = 0;          // độ dịch so với bản gốc, để menu xổ đi theo

  function keoDaiTruot() {
    TRUOT.forEach(function (t) {
      var e = els[t.k];
      if (!e || !e.tr.length) return;
      var x0 = null;
      e.tr.forEach(function (m) { if (m[0] === t.tu) x0 = m[1]; });
      var xCuoi = e.tr[e.tr.length - 1][1];
      if (x0 === null || x0 === xCuoi) return;
      var heSo = (x0 - t.xCuoi) / (x0 - xCuoi);
      e.tr.forEach(function (m) { if (m[0] > t.tu) m[1] = x0 - (x0 - m[1]) * heSo; });
    });
  }


  // Trang tĩnh (không có quỹ đạo cuộn, ví dụ trang Visit): nội dung có thể cao
  // hơn cửa sổ. Vì sân khấu đặt cố định nên phải tự dịch nội dung theo thanh cuộn,
  // nếu không phần dưới trang không tài nào xem được trên màn hình thấp.
  var TINH = !D.maxY;
  var DAY_ND = 0;
  D.items.forEach(function (it) {
    var m = it.tr[0];
    if (m) DAY_ND = Math.max(DAY_ND, m[2] + m[4]);
  });
  var cuonTinh = 0;
  // Nếu trang có mục dẫn tới phần khác, phải chừa đủ đường cuộn để phần được
  // trỏ tới lên được sát header, không thì bấm vào chẳng thấy gì nhúc nhích.
  var DICH_SAU = 0;
  Object.keys(NHAY).forEach(function (k) {
    var it = null;
    D.items.forEach(function (x) { if (x.k === NHAY[k]) it = x; });
    if (it && it.tr[0]) DICH_SAU = Math.max(DICH_SAU, it.tr[0][2]);
  });

  var els = {};
  var scale = 1;
  var offsetY = 0;
  var shiftY = 0;   // dịch dọc của nội dung khi chiều cao cửa sổ khác lúc đo

  function khungHeader() {
    if (!header) {
      header = document.createElement('header');
      header.id = 'topbar';
      if (LOGO) {
        var img = document.createElement('img');
        img.id = 'logo';
        img.src = url(LOGO.src);
        img.alt = 'planet BLU';
        // Bấm logo là về trang chủ, như thói quen chung của mọi trang web. Gắn
        // thẳng vào ảnh chứ không bọc thẻ <a>: ảnh đặt tuyệt đối nên thẻ bọc có
        // chiều cao 0 và không nhận được cú bấm.
        img.dataset.trang = LOGO.trang || 'index.html';
        img.style.cursor = 'pointer';
        header.appendChild(img);
      }
      stage.appendChild(header);
    }
    return header;
  }

  /* ---------- dựng DOM ---------- */
  function build() {
    var frag = document.createDocumentFragment();

    D.items.forEach(function (it) {
      var node;
      if (it.tag === 'video') {
        // Bản gốc phát video dạng HLS; bản dựng lại dùng tệp mp4 đã ghép sẵn,
        // hiện ảnh poster kèm nút phát tròn cho tới khi người xem bấm.
        node = document.createElement('div');
        node.className = 'video';
        var vid = document.createElement('video');
        vid.playsInline = true;
        vid.preload = 'none';
        vid.controls = false;
        if (it.src) vid.poster = url(it.src);
        if (it.video) vid.src = url('assets/video-' + it.video + '.mp4');
        node.appendChild(vid);
        var nut = document.createElement('span');
        nut.className = 'play';
        node.appendChild(nut);
        node.addEventListener('click', function () {
          if (vid.paused) { vid.play(); node.classList.add('playing'); vid.controls = true; }
          else { vid.pause(); node.classList.remove('playing'); }
        });
      } else if (it.svg) {
        // đường kẻ và mũi tên của biểu mẫu — bản gốc vẽ bằng SVG, giữ nguyên mã
        node = document.createElement('div');
        node.className = 'svg';
        node.innerHTML = it.svg;
        // Bản gốc gắn cứng width/height cho thẻ <svg> mà không có viewBox, nên khi
        // ta phóng khung theo hệ số zoom thì khung to ra còn nét vẽ vẫn nguyên cỡ —
        // đường kẻ ngắn hơn bản mẫu đúng 1,4 lần. Thêm viewBox để nét vẽ phóng theo.
        var sv = node.firstElementChild;
        if (sv && sv.tagName.toLowerCase() === 'svg' && !sv.getAttribute('viewBox')) {
          var wv = parseFloat(sv.getAttribute('width'));
          var hv = parseFloat(sv.getAttribute('height'));
          if (wv > 0 && hv > 0) sv.setAttribute('viewBox', '0 0 ' + wv + ' ' + hv);
        }
        // SVG của bản gốc lấy màu từ CSS ngoài, nên phải gán lại màu nét đã đo
        if (it.svgNet) {
          var nets = node.querySelectorAll('path, rect, circle, polygon');
          it.svgNet.forEach(function (m, i) {
            if (!nets[i]) return;
            nets[i].style.fill = m[0];
            nets[i].style.stroke = m[1];
            nets[i].style.strokeWidth = m[2];
          });
        }
      } else if (it.tag === 'img') {
        node = document.createElement('img');
        node.src = url(it.src);
        node.alt = '';
        node.loading = 'lazy';
        node.decoding = 'async';
        if (it.fit) node.style.objectFit = it.fit;
      } else {
        node = document.createElement('div');
        if (it.bg) {
          node.className = 'bg';
          node.style.backgroundImage = 'url("' + url(it.src) + '")';
          if (it.bgPos) node.style.backgroundPosition = it.bgPos;
        } else if (it.html) {
          node.className = 'txt';
          if (it.zt) {
            // lớp trong mang zoom giống bản gốc: cỡ chữ khai báo nhỏ, cả khối phóng lên
            var inner = document.createElement('div');
            inner.className = 'zoomed';
            inner.style.transform = 'scale(' + it.zt + ')';
            inner.style.transformOrigin = '0 0';
            inner.innerHTML = it.html;
            if (it.nowrap) inner.style.whiteSpace = 'pre';
            // Khối không nằm trong bảng ngắt dòng tức bản gốc chỉ có một dòng.
            // Chữ bản dựng lại nhỉnh hơn vài phần trăm nên dễ bị bẻ xuống dòng và
            // đè lên khối kế bên — chặn lại cho đúng bản gốc.
            else if (it.html.indexOf('<br>') < 0) inner.style.whiteSpace = 'nowrap';
            // đẩy ô vuông vào đúng cột bằng khoảng cách đo trên bản gốc
            if (it.pad) inner.style.paddingRight = (it.pad / it.zt).toFixed(3) + 'px';
            node.appendChild(inner);
            node._inner = inner;
          } else {
            node.innerHTML = it.html;
          }
        }
      }
      // mục dẫn tới một phần khác trong cùng trang
      if (NHAY[it.k]) { node.dataset.nhay = '1'; node.classList.add('navlink'); }
      var ch = CHINH[it.k];
      if (ch && ch.z) node.style.zIndex = ch.z;
      if (it.nut) node.classList.add('nut');
      // Bản gốc: rê vào thì cả chữ lẫn ô vuông mờ đi. Thanh điều hướng đã có sẵn
      // cách xử lý riêng nên không gắn chồng.
      if (it.mo && !it.fixed) node.classList.add('mo');
      node.className = 'el ' + node.className;
      node.dataset.k = it.k;

      var s = it.st || {};
      var tgt = node._inner || node;
      if (s.fs) {
        tgt.style.fontSize = it.fixed
          ? (parseFloat(s.fs) * PHONG_CHU_NAV).toFixed(2) + 'px'
          : s.fs;
      }
      if (s.fw) tgt.style.fontWeight = s.fw;
      if (s.lh) tgt.style.lineHeight = s.lh;
      if (s.ls && s.ls !== 'normal') tgt.style.letterSpacing = s.ls;
      if (s.color) tgt.style.color = s.color;
      if (s.ta && s.ta !== 'start') tgt.style.textAlign = s.ta;
      if (s.ff) tgt.style.fontFamily = s.ff;
      if (s.bgc) node.style.background = s.bgc;
      if (s.td) node.style.textDecoration = s.td;
      if (s.z) node.style.zIndex = s.z;

      // Slideshow: bản gốc không tự chạy, người xem bấm để sang ảnh kế
      if (it.slides && it.slides.length > 1) {
        node.classList.add('slideshow');
        node.style.backgroundImage = '';
        var track = document.createElement('div');
        track.className = 'track';
        it.slides.concat([it.slides[0]]).forEach(function (src) {
          var sl = document.createElement('div');
          sl.className = 'slide';
          sl.style.backgroundImage = 'url("' + url(src) + '")';
          track.appendChild(sl);
        });
        node.appendChild(track);
        node._track = track;
        node._at = 0;
        node._count = it.slides.length;
        node.addEventListener('click', function (ev) {
          var r = node.getBoundingClientRect();
          var back = (ev.clientX - r.left) / r.width < 0.25;
          step(node, back ? -1 : 1);
          ev.stopPropagation();
        });
      }

      // Liên kết giữ nguyên đích của bản gốc
      if (it.href) {
        node.classList.add('navlink');
        node.dataset.href = it.href;
      }
      // Liên kết tự thêm cho những chỗ bản mẫu bỏ trống. Gắn vào chính ký tự ô
      // vuông chứ không phải cả khối: hai mục cạnh nhau có hộp chồng lên nhau,
      // gắn cả khối thì chúng giành mất chuột của nhau.
      if (LIEN_KET[it.k] && node._inner) {
        var q = node._inner.innerHTML;
        if (q.indexOf('█') >= 0) {
          node._inner.innerHTML = q.replace(/█(?![\s\S]*█)/,
            '<a class="onut" data-trang="' + LIEN_KET[it.k] + '">█</a>');
          // Rê vào là cả dòng chữ lẫn ô vuông cùng mờ, như các mục bấm được khác.
          // Chỗ bấm vẫn là riêng ô vuông, nên nếu phần tử không tự mang liên kết
          // thì trả con trỏ chuột trên phần chữ về bình thường — bày con trỏ bấm
          // được ở chỗ bấm không ăn là đánh lừa người xem.
          node.classList.add('navlink');
          if (!it.href) node.classList.add('chi-onut');
        }
      }
      // thanh điều hướng luôn nằm trên nội dung, nếu không ảnh sẽ chặn mất chuột
      if (it.fixed) { node.classList.add('nav'); node.style.zIndex = 9000; }

      // Khối khai trong motDong: chữ và ô vuông ■ về cùng một dòng thay vì ô vuông
      // rớt xuống dòng dưới rồi đè lên chữ.
      if (it.motDong || MOT_DONG.indexOf(it.k) >= 0) {
        node.classList.add('one-line');
        if (node._inner) {
          node._inner.innerHTML = node._inner.innerHTML.replace(/<br\s*\/?>/gi, ' ');
          node._inner.style.whiteSpace = 'nowrap';
        }
      }
      els[it.k] = { node: node, tr: it.tr, i: 0, zt: node._inner ? it.zt : 0,
                    clip: '', fixed: !!it.fixed, xoay: it.xoay || '',
                    motDong: !!it.motDong || MOT_DONG.indexOf(it.k) >= 0 };
      if (it.fixed) khungHeader().appendChild(node);
      else frag.appendChild(node);
    });

    // menu xổ xuống
    DROPS.forEach(function (d, i) {
      var el = document.createElement(d.href || d.trang ? 'a' : 'div');
      el.className = 'drop';
      // Dựng y hệt mục điều hướng: chữ dàn ở cỡ nhỏ rồi phóng bằng transform.
      // Dùng zoom hay khai thẳng cỡ đã phóng đều cho ra ô vuông ■ lệch nửa pixel
      // so với ô của mục cha — đứng cạnh nhau là thấy so le.
      var lop = document.createElement('div');
      lop.className = 'zoomed';
      lop.textContent = d.text;
      el.appendChild(lop);
      if (d.trang) {
        el.href = url(d.trang);
      } else if (d.href) {
        var inside = localPage(d.href);
        el.href = inside || d.href;
        if (!inside) { el.target = '_blank'; el.rel = 'noopener'; }
      }
      el.dataset.y = d.y;
      if (d.x < MOC_PHAI) d.x += DICH_MUC;   // đi theo mục cha đã dịch
      // Dựng y hệt mục điều hướng: cỡ chữ khai nhỏ rồi phóng bằng zoom. Nếu khai
      // thẳng cỡ đã phóng, ô vuông ■ ra to hơn nửa pixel so với ô của mục cha —
      // đứng cạnh nhau là thấy so le.
      // Lớp trong phóng z lần quanh mép phải nên chiếm rộng d.w × z. Khối ngoài
      // (mang nền trắng) phải rộng đúng bấy nhiêu, giữ nguyên mép phải — không thì
      // chữ tràn ra ngoài nền và chìm nghỉm khi menu đè lên ảnh.
      var z = NAV_ZOOM;
      el.style.cssText = 'left:' + (d.x - d.w * (z - 1)).toFixed(2) + 'px;top:' +
        d.y + 'px;width:' + (d.w * z).toFixed(2) + 'px;height:' + d.h + 'px';
      lop.style.cssText = 'transform:scale(' + z + ');transform-origin:100% 0;' +
        'font-size:' + (d.fs * PHONG_CHU_NAV).toFixed(2) + 'px;line-height:' +
        (d.h / z).toFixed(3) + 'px;width:' + d.w + 'px;margin-left:auto';
      frag.appendChild(el);
      DROPS[i].el = el;
    });

    keoDaiTruot();
    stage.appendChild(frag);
    hookMenu();
    hookHover();
  }

  /* ---------- hiệu ứng rê chuột ---------- */
  function hookHover() {
    // Ảnh xem trước khai trong config.js theo từng trang; bố cục điện thoại
    // không có chuột nên bỏ qua.
    if (!PREVIEW.length || D.mobile) return;

    // ảnh xem trước của từng dòng sự kiện: ẩn sẵn, rê vào dòng thì hiện
    PREVIEW.forEach(function (p) {
      var row = els[p.row];
      if (!row) return;
      var img = document.createElement('img');
      img.className = 'el preview';
      img.src = url(p.src);
      img.alt = '';
      img.loading = 'lazy';
      img.style.width = p.w + 'px';
      img.style.height = p.h + 'px';
      stage.appendChild(img);
      row.picture = { node: img, dx: p.dx, dy: p.dy };
      row.node.classList.add('row');
      row.node.addEventListener('mouseenter', function () { img.classList.add('show'); });
      row.node.addEventListener('mouseleave', function () { img.classList.remove('show'); });
    });

    D.items.forEach(function (it) {
      var e = els[it.k];
      if (!e) return;
      var node = e.node;
      var label = (it.html || '').replace(/<[^>]*>/g, ' ').replace(/█/g, '').replace(/\s+/g, ' ').trim();

      // Mọi mục chữ bấm được đều mờ còn 30% khi rê chuột: nút More, tên tác phẩm
      // ở phần Project… Thanh điều hướng thì không, nó có hiệu ứng riêng.
      if (!it.fixed && (it.href || label === 'More')) {
        node.classList.add('navlink');
        node.addEventListener('mouseenter', function () { node.classList.add('faded-text'); });
        node.addEventListener('mouseleave', function () { node.classList.remove('faded-text'); });
        return;
      }
      // ảnh trong lưới tác phẩm: mờ đi khi rê vào
      if (it.tag === 'img' && it.tr[0][3] < 260) {
        node.addEventListener('mouseenter', function () { node.classList.add('faded-img'); });
        node.addEventListener('mouseleave', function () { node.classList.remove('faded-img'); });
      }
    });
  }

  /* ---------- menu ---------- */
  function hookMenu() {
    var groups = {};   // nhãn trên thanh điều hướng -> các mục con mở ra khi rê vào
    DROPS.forEach(function (d) {
      d.under.forEach(function (name) {
        (groups[name] = groups[name] || []).push(d.el);
      });
    });

    D.items.forEach(function (it) {
      var label = (it.html || '').replace(/<[^>]*>/g, ' ').replace(/█/g, '').replace(/\s+/g, ' ').trim();
      var g = groups[label];
      if (!g) return;
      var node = els[it.k] && els[it.k].node;
      if (!node) return;
      node.classList.add('navlink');

      var timer;
      var open = function () {
        clearTimeout(timer);
        g.forEach(function (e) { e.classList.add('open'); });
        node.classList.add('dimmed');   // bản gốc làm mờ mục đang mở
      };
      var close = function () {
        // Nán lại đủ lâu để người xem kịp rê chuột từ mục cha xuống mục con —
        // giữa hai chỗ có một quãng trống, đóng ngay là menu biến mất giữa chừng.
        timer = setTimeout(function () {
          g.forEach(function (e) { e.classList.remove('open'); });
          node.classList.remove('dimmed');
        }, 700);
      };
      node.addEventListener('mouseenter', open);
      node.addEventListener('mouseleave', close);
      g.forEach(function (e) {
        e.addEventListener('mouseenter', open);
        e.addEventListener('mouseleave', close);
      });
    });
  }

  /* ---------- nội suy theo vị trí cuộn ---------- */
  function lerp(e, sy) {
    var tr = e.tr, n = tr.length;
    var i = e.i;
    while (i > 0 && tr[i][0] > sy) i--;
    while (i < n - 2 && tr[i + 1][0] <= sy) i++;
    e.i = i;
    var a = tr[i], b = tr[Math.min(i + 1, n - 1)];
    var t = b[0] === a[0] ? 0 : (sy - a[0]) / (b[0] - a[0]);
    if (t < 0) t = 0; else if (t > 1) t = 1;
    var out = [];
    for (var j = 1; j < a.length; j++) out.push(a[j] + (b[j] - a[j]) * t);
    return out;
  }

  function place(sy) {
    for (var k in els) {
      var e = els[k];
      var tr = e.tr;
      var n = tr.length;
      var first = tr[0][0], last = tr[n - 1][0];
      var node = e.node;

      if (sy < first - 60 || sy > last + 60) {
        if (node.style.display !== 'none') node.style.display = 'none';
        continue;
      }
      if (node.style.display === 'none') node.style.display = '';

      var i = e.i;
      while (i > 0 && tr[i][0] > sy) i--;
      while (i < n - 2 && tr[i + 1][0] <= sy) i++;
      e.i = i;

      var a = tr[i], b = tr[Math.min(i + 1, n - 1)];
      var t = b[0] === a[0] ? 0 : (sy - a[0]) / (b[0] - a[0]);
      if (t < 0) t = 0; else if (t > 1) t = 1;

      var chinh = CHINH[k];
      var x = a[1] + (b[1] - a[1]) * t + (chinh && chinh.dx || 0);
      // Mục bên trái dịch sang nhường chỗ cho logo. Trên điện thoại chỉ có nút mở
      // menu, và khối của nó trải gần hết bề ngang nên cũng chỉ dịch chứ không
      // căn được về mép phải.
      if (e.fixed && a[1] < MOC_PHAI) x += DICH_MUC;
      var y = a[2] + (b[2] - a[2]) * t;
      var w = a[3] + (b[3] - a[3]) * t;
      var h = a[4] + (b[4] - a[4]) * t;
      var o = a[5] + (b[5] - a[5]) * t;

      // Mờ dần ở hai đầu quỹ đạo, nơi bản gốc gỡ phần tử khỏi trang. Không áp
      // cho phần tử có mặt tới tận đầu hoặc cuối tài liệu — chúng luôn hiện.
      if (sy < first && first > 0) o *= 1 - (first - sy) / 60;
      else if (sy > last && last < D.maxY) o *= 1 - (sy - last) / 60;

      // Mục điều hướng không dùng toạ độ dọc đo được nữa mà canh giữa trong header;
      // phần nội dung vẫn trôi theo trang như cũ.
      // Mọi mục dùng chung một mốc trên: chúng cùng cỡ chữ nên chữ tự thẳng hàng.
      // Bù theo chiều cao từng khối sẽ làm mục "About us" (một dòng) lệch lên.
      if (e.fixed) y = yNav;
      else y += shiftY + (chinh && chinh.dy || 0) - cuonTinh;
      node.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0)' +
        (e.xoay ? ' ' + e.xoay : '');
      if (!e.motDong) {
        node.style.width = w.toFixed(1) + 'px';
        // "cao" trong config.js thu nhỏ vùng nhận chuột của khối mà không cắt
        // nội dung — dùng khi hai khối chữ chồng lên nhau và giành mất chuột.
        node.style.height = ((chinh && chinh.cao) || h).toFixed(1) + 'px';
      }

      // phần bị khung của bản gốc cắt bớt (trái, trên, phải, dưới)
      var cl = a[6] + (b[6] - a[6]) * t, ct = a[7] + (b[7] - a[7]) * t;
      var cr = a[8] + (b[8] - a[8]) * t, cb = a[9] + (b[9] - a[9]) * t;
      var clip = (cl + ct + cr + cb) > 0.5
        ? 'inset(' + ct.toFixed(1) + 'px ' + cr.toFixed(1) + 'px ' +
                     cb.toFixed(1) + 'px ' + cl.toFixed(1) + 'px)'
        : '';
      if (clip !== e.clip) { node.style.clipPath = clip; e.clip = clip; }
      if (e.zt) {
        // khối bên trong đo bằng hệ chưa phóng, đúng như bản gốc
        node._inner.style.width = (w / e.zt).toFixed(2) + 'px';
        node._inner.style.height = (h / e.zt).toFixed(2) + 'px';
      }
      // ảnh xem trước bám theo dòng của nó
      if (e.picture) {
        e.picture.node.style.transform = 'translate3d(' +
          (x + e.picture.dx).toFixed(1) + 'px,' + (y + e.picture.dy).toFixed(1) + 'px,0)';
      }
      if (o < 0.999) node.style.opacity = o.toFixed(3);
      else if (node.style.opacity) node.style.opacity = '';
    }
  }

  /* ---------- đường dẫn theo phần đang xem ---------- */
  var route = '';
  function syncRoute(sy) {
    // chỉ trang chính mới đổi địa chỉ theo phần đang xem; trang con giữ nguyên
    // đường dẫn thư mục của nó
    if (!/(^|\/)index\.html?$|\/$/.test(location.pathname)) return;
    var p = ROUTES[0][1];
    for (var i = 0; i < ROUTES.length; i++) if (sy >= ROUTES[i][0]) p = ROUTES[i][1];
    if (p !== route) {
      route = p;
      // Mở bằng file:// thì trình duyệt cấm đổi địa chỉ; bỏ qua chứ đừng để
      // ngoại lệ làm đứng cả vòng cập nhật vị trí.
      try { history.replaceState(null, '', p); } catch (e) { /* không đổi được thì thôi */ }
    }
  }

  /* ---------- vòng lặp hiển thị ----------
     Bản gốc không bám cứng vào vị trí cuộn mà trôi mềm về đích, nên ở đây cũng
     đuổi theo bằng nội suy từng khung hình thay vì nhảy thẳng. */
  var cur = 0, target = 0, running = false;

  function frame() {
    var d = target - cur;
    if (Math.abs(d) < 0.05) {
      cur = target;
      running = false;
    } else {
      cur += d * 0.16;
      requestAnimationFrame(frame);
    }
    place(cur);
    syncRoute(cur);
  }

  // Vị trí cuộn của bản gốc, suy từ tiến độ cuộn hiện tại. Dùng tỉ lệ thay vì
  // chia cho scale để luôn chạm được hai đầu quỹ đạo, kể cả khi thanh cuộn
  // chiếm chỗ làm cả khối bị thu nhỏ.
  function progress() {
    var max = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    return max > 0 ? Math.min(1, window.scrollY / max) * D.maxY : 0;
  }

  // Sân khấu đặt cố định nên không tự trôi theo thanh cuộn ngang; phải tự dịch.
  function veStage() {
    stage.style.transform = 'translateX(' + (-truotNgang) + 'px) scale(' + scale + ')';
  }

  function onScroll() {
    if (window.scrollX !== truotNgang) { truotNgang = window.scrollX; veStage(); }
    if (TINH) { cuonTinh = window.scrollY / scale; place(0); return; }
    target = progress();
    if (!running) { running = true; requestAnimationFrame(frame); }
  }

  // Bản gốc dựng nội dung trên một canvas cố định rồi phóng theo bề rộng cửa sổ và
  // canh phần dư theo chiều cao. Máy tính dùng canvas 1024×608, điện thoại 320×568.
  var CANVAS_W = D.canvasW || 1024, CANVAS_H = D.canvasH || 608;

  function contentShift(vw, vh) {
    var zoom = vw / CANVAS_W;
    return Math.max(0, (vh / zoom - CANVAS_H) / 2);   // tính theo hệ canvas
  }

  var SHIFT0 = contentShift(D.baseW, D.baseH);   // phần canh dọc lúc đo bản gốc

  // Bản gốc thôi thu nhỏ khi cửa sổ hẹp hơn 768px: dưới ngưỡng đó nó giữ nguyên
  // cỡ chữ và bố cục, cho người xem cuộn ngang. Bản điện thoại không có ngưỡng
  // này vì nó vốn đã vẽ cho màn hẹp.
  var RONG_TOI_THIEU = D.mobile ? 0 : ((CFG.rongToiThieu === undefined) ? 768 : CFG.rongToiThieu);
  var truotNgang = 0;

  function resize() {
    var vw = document.documentElement.clientWidth;
    var vh = document.documentElement.clientHeight;
    var vwKhung = Math.max(vw, RONG_TOI_THIEU);  // hẹp hơn ngưỡng thì thôi thu nhỏ
    scale = vwKhung / D.baseW;                   // phóng theo bề rộng, như bản gốc
    offsetY = 0;
    // nội dung (trừ thanh điều hướng) dịch dọc theo phần dư của chiều cao cửa sổ
    shiftY = (contentShift(vwKhung, vh) - SHIFT0) * (D.baseW / CANVAS_W);
    spacer.style.width = vwKhung + 'px';   // đủ rộng để hiện thanh cuộn ngang
    truotNgang = window.scrollX;
    veStage();

    // Header: cao cố định 36px trên màn hình, nên trong hệ toạ độ của sân khấu
    // phải chia lại cho hệ số phóng. Mục điều hướng canh giữa dải đó.
    var caoHeader = CAO_HEADER / scale;
    var yCu = yNav;
    // Khối mục điều hướng cao 15,5 trong hệ toạ độ sân khấu; lấy 14,1 thì phần
    // chừa trên dày hơn phần dưới 1,3px.
    yNav = (caoHeader - 15.5) / 2;
    if (!yCu) yCu = 6.5;                      // vị trí đo được của bản gốc
    dyNav = yNav - 6.5;
    if (header) header.style.height = caoHeader.toFixed(2) + 'px';
    // menu xổ nằm ngay dưới header nên đi theo
    DROPS.forEach(function (d) {
      if (d.el) d.el.style.top = (parseFloat(d.el.dataset.y) + dyNav).toFixed(2) + 'px';
    });
    // đủ cao để cuộn hết quỹ đạo đã đo, kể cả khi cả khối bị thu nhỏ
    spacer.style.height = TINH
      ? Math.max(DAY_ND * scale + 40,
                 DICH_SAU * scale + vh) + 'px'   // xem hết nội dung, và đủ chỗ nhảy
      : (D.maxY * scale + vh) + 'px';
    if (TINH) cuonTinh = window.scrollY / scale;
    cur = target = progress();
    place(cur);
    // Sau place(): logo canh theo ô vuông của mục điều hướng nên phải đợi các
    // mục ấy về đúng chỗ, không thì đo trúng vị trí cũ.
    datLogo(caoHeader);
    syncRoute(cur);
  }

  /* ---------- chuyển ảnh trong slideshow ---------- */
  function step(node, dir) {
    var track = node._track;
    var n = node._count;
    var at = node._at + dir;
    if (at < 0) {                       // nhảy về cuối rồi trượt tiếp cho liền mạch
      track.style.transition = 'none';
      track.style.transform = 'translateX(' + (-n * 100) + '%)';
      void track.offsetWidth;
      at = n - 1;
    }
    node._at = at;
    track.style.transition = 'transform .55s cubic-bezier(.4,0,.2,1)';
    track.style.transform = 'translateX(' + (-at * 100) + '%)';
    if (at === n) {
      setTimeout(function () {
        track.style.transition = 'none';
        track.style.transform = 'translateX(0)';
        node._at = 0;
      }, 580);
    }
  }

  /* Đặt logo. Nếu cấu hình khai ô vuông ■ nằm ở đâu trong ảnh thì phóng và canh
     sao cho ô ấy trùng cỡ, trùng hàng với ô vuông của các mục điều hướng — cả
     hàng đọc thành một dải đều. Không khai thì chỉ canh giữa theo chiều dọc. */
  function datLogo(caoHeader) {
    var anh = header && header.querySelector('#logo');
    if (!anh || !LOGO) return;
    var viTri = D.mobile ? (LOGO.viTriMobile || 'trai') : 'trai';
    if (viTri === 'trai') anh.style.left = ((LOGO.trai || 0) / scale).toFixed(2) + 'px';

    var oV = LOGO.oVuong, moc = oV && oVuongNav();
    if (moc) {
      // dải ô vuông chiếm (duoi - tren) phần chiều cao ảnh
      var cao = moc.cao / (oV.duoi - oV.tren);
      anh.style.height = cao.toFixed(2) + 'px';
      anh.style.top = (moc.tren - cao * oV.tren).toFixed(2) + 'px';
      if (viTri !== 'trai') datLogoNgang(anh, viTri);
      return;
    }
    var c = (LOGO.cao || 26) / scale;
    anh.style.height = c.toFixed(2) + 'px';
    anh.style.top = ((caoHeader - c) / 2).toFixed(2) + 'px';
    if (viTri !== 'trai') datLogoNgang(anh, viTri);
  }

  /* Canh logo vào giữa hoặc sát mép phải khung nhìn. Không dùng CSS `right` được
     vì sân khấu rộng cố định 1425px chứ không bằng bề rộng bố cục, nên mép phải
     của nó nằm ngoài màn hình. */
  function datLogoNgang(anh, viTri) {
    var rong = anh.getBoundingClientRect().width / scale;
    var x = viTri === 'giua' ? (D.baseW - rong) / 2
                             : D.baseW - (LOGO.phai || 0) - rong;
    anh.style.left = x.toFixed(2) + 'px';
  }

  /* Mép trên và chiều cao của ô vuông ■ trên một mục điều hướng, đo thật trong hệ
     toạ độ của sân khấu. */
  function oVuongNav() {
    var r = null, xNho = Infinity;
    header.querySelectorAll('.el').forEach(function (e) {
      // Lấy mục sát logo nhất — đó chính là mục người xem đặt cạnh để so. Các
      // mục không giống nhau hoàn toàn: ô vuông của "EN" và "About us" thấp hơn
      // 1,4px so với "Event", nên lấy bừa mục đầu tiên là canh trượt.
      var xe = e.getBoundingClientRect().left;
      if (xe >= xNho) return;
      var z = e.querySelector('.zoomed') || e;
      var n = null;
      for (var i = 0; i < z.childNodes.length; i++) {
        var x = z.childNodes[i];
        if (x.nodeType === 3 && x.textContent.indexOf('█') >= 0) { n = x; break; }
      }
      if (!n) return;
      var g = document.createRange();
      var j = n.textContent.indexOf('█');
      g.setStart(n, j); g.setEnd(n, j + 1);
      var q = g.getBoundingClientRect();
      if (q.height < 1) return;
      var hd = header.getBoundingClientRect();
      xNho = xe;
      r = { tren: (q.top - hd.top) / scale, cao: q.height / scale };
    });
    return r;
  }

  /* ---------- ô nhập của biểu mẫu ----------
     Bản gốc chỉ vẽ đường kẻ chứ không có ô nhập thật. Đặt một ô nhập trong suốt
     ngay trên mỗi đường kẻ để người xem bấm vào gõ được, giữ nguyên diện mạo. */
  function themONhap() {
    stage.querySelectorAll('.el.svg').forEach(function (kh) {
      var r = kh.getBoundingClientRect();
      if (r.width < 100) return;
      // Đường kẻ của biểu mẫu là một nét ngang dài, nằm lửng trong khối; mũi tên
      // của ô chọn thì nhỏ và cao. Chỉ khối có nét ngang mới cần ô nhập.
      var net = null;
      kh.querySelectorAll('path').forEach(function (q) {
        var b = q.getBoundingClientRect();
        if (b.width > 100 && b.height < 3) net = b;
      });
      if (!net) return;
      // Trường nào khai trong oChon thì dựng ô chọn thay vì ô gõ chữ; mũi tên ▼
      // của bản mẫu đã có sẵn nên giấu mũi tên mặc định của trình duyệt đi.
      var chon = O_CHON[kh.dataset.k];
      var o;
      if (chon) {
        o = document.createElement('select');
        o.className = 'onhap ochon';
        o.setAttribute('aria-label', 'ô chọn');
        var rong = document.createElement('option');
        rong.value = '';
        rong.textContent = '';
        o.appendChild(rong);
        chon.forEach(function (v) {
          var t = document.createElement('option');
          t.value = v;
          t.textContent = v;
          o.appendChild(t);
        });
      } else {
        o = document.createElement('input');
        o.type = 'text';
        o.className = 'onhap';
        o.setAttribute('aria-label', 'ô nhập');
      }
      // Kích thước ô nhập và khoảng đẩy đường kẻ xuống — số do anh Thông chỉnh
      // tay trong devtools rồi chốt lại, không tính lại theo cỡ chữ.
      var on = CFG.oNhap || {};
      o.style.height = (on.cao === undefined ? 17.44 : on.cao) + 'px';
      o.style.top = (on.tren === undefined ? 0.9 : on.tren) + 'px';
      // Đẩy nét kẻ xuống để chữ gõ vào có chỗ thở phía trên. Dùng lề của chính thẻ
      // svg — nếu dùng padding của khối thì vùng nội dung co lại và nét vẽ phóng
      // lệch tỉ lệ theo chiều dọc.
      var sv2 = kh.querySelector('svg');
      if (on.dayKe && sv2) sv2.style.marginTop = on.dayKe + 'px';
      kh.appendChild(o);
    });
  }

  /* Trượt sao cho một phần tử dừng ngay dưới header.

     Trang tĩnh thì chỉ việc cuộn cửa sổ. Trang có quỹ đạo thì phần tử di chuyển
     theo vị trí cuộn chứ không đứng yên, nên phải dò trong chính quỹ đạo đã đo
     xem cuộn tới đâu thì nó nằm đúng chỗ. */
  function truotToi(e) {
    var dinh = (CAO_HEADER + 12) / scale - shiftY;
    if (TINH) {
      var r = e.node.getBoundingClientRect();
      window.scrollBy({ top: r.top - CAO_HEADER - 12, behavior: 'smooth' });
      return;
    }
    var tr = e.tr, sy = null;
    for (var i = 0; i < tr.length - 1; i++) {
      var a = tr[i], b = tr[i + 1];
      if (a[2] === b[2]) continue;
      if ((a[2] - dinh) * (b[2] - dinh) <= 0) {
        sy = a[0] + (b[0] - a[0]) * (dinh - a[2]) / (b[2] - a[2]);
        break;
      }
    }
    // Có phần nằm quá gần cuối trang, cuộn hết cỡ vẫn không lên tới sát header —
    // khi đó đưa nó lên cao nhất trong khả năng của trang.
    if (sy === null) {
      var caoNhat = tr[0];
      tr.forEach(function (m) { if (m[2] < caoNhat[2]) caoNhat = m; });
      sy = caoNhat[0];
    }
    var max = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    window.scrollTo({ top: sy / D.maxY * max, behavior: 'smooth' });
  }

  /* ---------- bấm vào liên kết ----------
     Phần nào có trong trang này thì cuộn tới; phần trỏ sang dự án khác của bản gốc
     thì mở đúng địa chỉ đó, y như bản gốc. */
  var SECTION = {};
  ROUTES.forEach(function (r) {
    var name = r[1].replace(/\//g, '');
    SECTION[{ '': 'Planet BLU', event: 'Event', project: 'Project',
              archive: 'Archive', aboutus: 'About us' }[name] || name] = r[0];
  });

  stage.addEventListener('click', function (ev) {
    var t = ev.target.closest('[data-href], [data-trang], [data-nhay], .drop');
    if (!t) return;
    var label = (t.textContent || '').replace(/█/g, '').replace(/\s+/g, ' ').trim();
    var href = t.dataset.href || t.getAttribute('href');

    if (t.dataset.trang) {
      ev.preventDefault();
      window.location.href = url(t.dataset.trang);
      return;
    }

    // trượt tới phần tương ứng trong cùng trang
    var dich = NHAY[t.dataset.k];
    if (dich && els[dich]) {
      ev.preventDefault();
      truotToi(els[dich]);
      return;
    }

    // liên kết đã trỏ vào chính bản dựng lại thì để trình duyệt tự đi
    if (href && href.indexOf(location.origin) === 0) return;

    // đích nằm trong chính trang này (About us, Planet BLU) → cuộn tới
    var inPage = href && href.indexOf('/6477513/') >= 0;
    if (inPage && SECTION[label] !== undefined) {
      ev.preventDefault();
      var max = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      window.scrollTo({ top: SECTION[label] / D.maxY * max, behavior: 'smooth' });
      return;
    }
    if (href) {
      ev.preventDefault();
      // trang nào đã dựng lại thì đi thẳng trong site, còn lại mở bản gốc
      var here = localPage(href);
      if (here) window.location.href = here;
      else window.open(href, '_blank', 'noopener');
      return;
    }
    if (SECTION[label] !== undefined) {
      ev.preventDefault();
      var m = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      window.scrollTo({ top: SECTION[label] / D.maxY * m, behavior: 'smooth' });
    }
  });

  // Mở trang chủ kèm #aboutus / #project… thì nhảy thẳng tới đoạn đó, vì đây là
  // đường về từ các trang con — bản gốc cũng dừng ở chính đoạn ấy.
  function toiDoan() {
    var ten = location.hash.replace('#', '');
    if (!ten) return;
    var moc = null;
    ROUTES.forEach(function (r) { if (r[1].replace(/\//g, '') === ten) moc = r[0]; });
    if (moc === null) return;
    var max = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    window.scrollTo(0, moc / D.maxY * max);
  }

  build();
  resize();
  resize();   // lần hai: sau khi thanh cuộn xuất hiện, bề rộng khả dụng đã đổi
  themONhap();   // sau khi đã đặt vị trí, mới đo được đâu là đường kẻ
  // Lúc này bộ chữ có thể chưa tải xong, mà logo lại canh theo ô vuông ■ của mục
  // điều hướng — đo sớm là trúng số đo của font tạm. Canh lại khi chữ đã sẵn sàng.
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () { resize(); });
  }
  toiDoan();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', resize);
  // Xoay ngang/dọc có thể vượt ngưỡng đổi bố cục; hai bố cục dùng hai bộ dữ liệu
  // khác nhau nên phải nạp lại trang chứ không dựng lại tại chỗ được.
  window.addEventListener('resize', function () {
    if (laDienThoai() !== HEP) location.reload();
  });
})();
