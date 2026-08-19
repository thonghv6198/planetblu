/* Cấu hình của một dự án dựng trên bộ khung planetBLU.

   Toàn bộ những gì phụ thuộc vào NỘI DUNG nằm ở đây; app.js chỉ là bộ máy chạy
   và không cần sửa khi làm dự án mới. Muốn dựng dự án khác trên cùng bố cục thì
   thay dữ liệu (data-*.js, assets/) rồi chỉnh các mục dưới đây.

   Khoá "kNN" là mã phần tử do tools/measure.js đánh khi đo bản gốc. Xem mã nào
   ứng với chữ nào bằng:
       python3 tools/liet-ke.py <tên trang>
*/
window.PB_CFG = {

  /* ---------- thanh điều hướng ---------- */
  header: {
    cao: 50,          // chiều cao dải header, tính bằng pixel màn hình
    phongChu: 1.15,   // cỡ chữ trên header so với bản gốc (1 = giữ nguyên)
    // Logo đứng đầu thanh, các mục điều hướng dịch sang phải nhường chỗ.
    // Bỏ cả khối này thì thanh trở về như cũ, không có logo.
    logo: {
      src: 'assets/logo.png',
      // Logo thế chỗ mục "Planet BLU" ở cuối thanh, nên canh theo mép phải.
      viTri: 'phai',        // bản máy tính: 'trai' | 'giua' | 'phai'
      phai: 27,             // cách mép phải (bản máy tính)
      phaiMobile: 23,       // cách mép phải (bản điện thoại)
      trai: 28,       // cách mép trái, dùng khi viTri là 'trai'
      // Bản điện thoại: 'giua' | 'phai' | 'trai'. Đặt giữa để không đè lên nút mở
      // menu bên trái và cụm "EN / Planet BLU" bên phải.
      viTriMobile: 'phai',
      dichMuc: 0,     // logo không còn nằm bên trái nên khỏi đẩy các mục
      // Ô vuông ■ nằm ở đâu trong ảnh, tính theo tỉ lệ chiều cao. Nhờ hai số này
      // logo tự phóng và tự canh sao cho ô vuông của nó trùng cỡ, trùng hàng với
      // ô vuông của các mục điều hướng. Đo bằng: python3 tools/do-logo.py
      oVuong: { tren: 0.389, duoi: 0.887 },
      cao: 26         // dùng khi không khai oVuong
    }
  },

  /* Mục điều hướng bỏ hẳn — logo đã thế chỗ. */
  boMuc: ['Planet BLU'],

  /* Mục điều hướng thêm tay: bản mẫu không có EN ở trang chủ khổ điện thoại,
     trong khi các trang con đều có. Toạ độ lấy theo mục EN của trang con. */
  themMuc: {
    'index.html@mobile': [{ text: 'EN █', x: 189.2, fs: 8 }]
  },

  /* Hệ số phóng của các mục điều hướng trong bản gốc — dùng cho menu xổ xuống
     để cỡ chữ mục con khớp mục cha. */
  navZoom: 1.4063,

  /* Độ đậm của mục điều hướng (trục `wght` của Inter). Menu xổ dùng chung số này
     để ô vuông ■ và nét chữ khớp với mục cha. */
  wghtNav: 589,
  gianChuNav: '-0.2px',

  /* ---------- menu xổ xuống ---------- */
  /* under: rê vào những mục nào trên thanh điều hướng thì nhóm này mở ra
     x, y, w, h: vị trí và kích thước, theo hệ toạ độ của bản gốc
     trang: trang nội bộ để mở  |  href: địa chỉ ngoài  |  bỏ cả hai = không bấm được */
  menuXo: [
    { under: ['Project'], x: 80.87, y: 22, w: 100, h: 15, fs: 8,
      text: 'Hoa và Rác █', trang: 'hoavarac.html' },
    { under: ['Project'], x: 104.87, y: 37.45, w: 76, h: 14, fs: 8,
      text: 'Giants █', trang: 'giants.html' },
    { under: ['EN'], x: 1219, y: 22, w: 84.6, h: 14, fs: 8, text: 'VN █' }
  ],

  /* ---------- menu của bản điện thoại ---------- */
  /* Chạm nút gạch thì phủ kín màn hình. Toạ độ theo hệ của bố cục điện thoại
     (rộng 375), đo từ bản mẫu. */
  menuMobile: {
    phai: 29,     // mép phải của cụm chữ
    dau: 302,     // vị trí dọc của mục đầu
    buoc: 48,     // khoảng cách giữa các mục
    co: 34,       // cỡ chữ
    muc: [
      { text: 'Event',    trang: 'event.html' },
      { text: 'Project',  trang: 'hoavarac.html' },
      { text: 'Archive',  trang: 'archive.html' },
      { text: 'Visit',    trang: 'visit.html' },
      { text: 'About us', trang: 'index.html#aboutus' }
    ]
  },

  /* ---------- ảnh xem trước khi rê vào một dòng sự kiện ---------- */
  /* row: mã dòng sự kiện; dx, dy: lệch so với dòng đó; src: ảnh trong assets/ */
  xemTruoc: {
    'index.html': [
      { row: 'k46', dx: 205, dy: 14, w: 125, h: 156,
        src: 'assets/image-364fce87-a3ea-449c-a5c4-fa6116909c-8cef9988.webp' },
      { row: 'k50', dx: 204, dy: 14, w: 128, h: 162,
        src: 'assets/image-e17d0a2d-791c-47f8-9482-2a58a1bb82-4c6306c1.webp' },
      { row: 'k53', dx: 202, dy: 14, w: 128, h: 75,
        src: 'assets/image-f57127c0-1e96-4322-b93b-a1b1e81ed5-a905f067.webp' }
    ]
  },

  /* ---------- bấm để trượt tới phần khác trong cùng trang ---------- */
  /* { mã mục bấm vào: mã phần cần trượt tới } */
  /* Mã kNN của bản điện thoại đánh riêng nên phải khai riêng bằng hậu tố
     '@mobile'; tra mã bằng: python3 tools/liet-ke.py mobile-<tên trang> */
  nhay: {
    'visit.html':    { k0: 'k3', k1: 'k5' },
    'visit.html@mobile': { k0: 'k3', k1: 'k5' },
    // "Coming soon" / "Past event" ở đầu trang dẫn xuống đúng phần bên dưới.
    // "Contact us" đã có sẵn liên kết của bản mẫu nên để nguyên.
    'event.html':    { k0: 'k4', k1: 'k5' },
    'event.html@mobile': { k0: 'k5', k1: 'k6' },
    'hoavarac.html': { k0: 'k10', k1: 'k14', k2: 'k17', k3: 'k4' },
    'hoavarac.html@mobile': { k0: 'k11', k1: 'k16', k2: 'k19', k3: 'k5' },
    'giants.html':   { k0: 'k10', k1: 'k14', k2: 'k17', k3: 'k4' },
    'giants.html@mobile':   { k0: 'k11', k1: 'k16', k2: 'k19', k3: 'k5' }
  },

  /* ---------- ô nhập của biểu mẫu ---------- */
  /* cao, tren: kích thước và vị trí ô nhập (px)
     dayKe: đẩy nét kẻ xuống bấy nhiêu để chữ gõ vào có chỗ thở phía trên */
  oNhap: { cao: 17.44, tren: 0.9, dayKe: 5 },

  /* Trường nào là ô chọn thay vì ô gõ chữ, kèm các lựa chọn mẫu.
     Khoá là mã của khối chứa đường kẻ — tra bằng tools/liet-ke.py. */
  oChon: {
    'visit.html': {
      k12: ['Hoa và rác', 'Giants', 'Routine'],
      k14: ['Standard', 'Student', 'Group'],
      k20: ['20.11.2026', '21.11.2026', '22.11.2026']
    },
    'visit.html@mobile': {
      k10: ['Hoa và rác', 'Giants', 'Routine'],
      k12: ['Standard', 'Student', 'Group'],
      k18: ['20.11.2026', '21.11.2026', '22.11.2026']
    }
  },

  /* ---------- giãn chữ và giãn dòng ---------- */
  /* Bỏ cả khối này thì trả về đúng số đo của bản mẫu.
       gianChu:          giá trị letter-spacing áp cho mọi khối chữ
       gianDongToiThieu: giãn dòng tối thiểu, tính theo lần cỡ chữ (chỉ khối
                         nhiều dòng; khối một dòng nới sẽ trôi khỏi chỗ đã đo) */
  // Giãn chữ để 0 thay vì các giá trị âm của bản mẫu (-0,2 đến -1px).
  // Giãn dòng vẫn giữ đúng bản mẫu.
  chu: { gianChu: '0px' },

  /* ---------- canh ô vuông ■ về cùng một cột ---------- */
  /* Mỗi nhóm là danh sách mã khối; khối đầu làm mốc, các khối sau tự dịch cho
     mép phải ô vuông trùng nhau. Đo tại chỗ nên không sai khi đổi độ đậm hay
     giãn chữ — khác với việc ghim sẵn số dịch trong `chinh`. */
  canhO: {
    'index.html':        [['k67', 'k68']],
    // nhóm "Video / Exhibition / Technical drawing / Support" ở trang tác phẩm
    'hoavarac.html':        [['k0', 'k1', 'k2', 'k3']],
    'hoavarac.html@mobile': [['k0', 'k1', 'k2', 'k3']],
    'giants.html':          [['k0', 'k1', 'k2', 'k3']],
    'giants.html@mobile':   [['k0', 'k1', 'k2', 'k3']],
    'visit.html':        [['k0', 'k1', 'k2']],
    'visit.html@mobile': [['k0', 'k1', 'k2']],
    'event.html':        [['k0', 'k1', 'k2']],
    'event.html@mobile': [['k0', 'k1', 'k3']]
  },

  /* ---------- ép chữ và ô vuông ■ về cùng một dòng ---------- */
  /* Bản mẫu để ô vuông rớt xuống dòng dưới rồi đè lên chữ; khai ở đây để nó nằm
     ngay sau chữ. */
  motDong: {
    'index.html': ['k67', 'k68'],
    // "Buy ticket ■": bản mẫu để ô vuông xuống dòng, đè lên dòng ngày bên dưới
    'event.html': ['k9']
  },

  /* ---------- gắn liên kết cho một phần tử ---------- */
  /* Dùng khi bản mẫu không để sẵn liên kết. { mã phần tử: trang cần mở } */
  lienKet: {
    'index.html': {
      k67: 'hoavarac.html',   // ô vuông của "Hoa và rác" ở phần Project
      k68: 'giants.html'      // ô vuông của "Giants"
    }
  },

  /* ---------- chỉnh tay vị trí từng phần tử ---------- */
  /* Những chỗ cố ý khác bản mẫu. dx: dịch ngang, dy: dịch dọc (pixel). */
  chinh: {
    'index.html': {
      // ảnh mở đầu trang chủ kéo lên cho liền với header
      k18: { dy: -29 },
      /* Phần About: chữ dài hơn bản mẫu nên tràn sang nửa phải và chui xuống
         dưới tấm ảnh. Chặn mép phải ở giữa trang; ảnh bắt đầu ở 49,3% nên lấy
         0,49 để chữ dừng ngay trước mép ảnh. */
      k106: { capPhai: 0.49 },
      k111: { capPhai: 0.49 },
      // "Hoa và rác" và "Giants": ô vuông chuyển về cùng dòng với chữ nên khối
      // dài thêm sang phải và đè lên ảnh bên cạnh. Kéo sang trái để mép phải về
      // đúng chỗ cũ, đồng thời hai ô vuông thẳng cột và chạm nhau.
      k67: { dx: -34.7 },
      k68: { dx: -34.7, dy: -0.31 }
    },
    // nhóm "Coming soon / Past event / Contact us" thẳng cột với "Current"
    'event.html': {
      k0: { dx: 6.8 }, k1: { dx: 6.8 }, k2: { dx: 6.8 },
      /* Tên và thể loại của sự kiện đang diễn ra: khung bản mẫu chỉ vừa khít
         "Hoa và rác" nên tên dài hơn bị thu nhỏ chữ. Nới bằng khung của mục
         "Sắp diễn ra" bên dưới để cỡ chữ hai mục bằng nhau. */
      k7: { rong: 218 }, k8: { rong: 218 },
      // khoảng ngày dài hơn ngày mẫu nên cũng bị thu
      k10: { rong: 150 }
    },
    'event.html@mobile': {
      k0: { dx: 4.8 }, k1: { dx: 1.4 },
      k9: { rong: 181.6 }, k10: { rong: 181.6 }, k11: { rong: 150 }
    },
    'visit.html': {
      // hai ô vuông rời về đúng cột với nhóm bên trên
      k3: { dx: -1.2 }, k5: { dx: -1.2 },
      // nhãn Name/Email chừa khoảng cách với đường kẻ như các trường khác
      k22: { dy: -14.7 }, k23: { dy: -14.7 },
      k26: { dy: -14.7 }, k27: { dy: -14.7 },
      // Mũi tên ▼ hạ xuống ngang hàng với nhãn của trường, đúng như bản mẫu.
      k11: { dy: 13.4 }, k13: { dy: 14.8 }, k19: { dy: 13.4 }
    },
    'visit.html@mobile': {
      k22: { dy: -12.2 }, k23: { dy: -12.2 },
      k26: { dy: -12.2 }, k27: { dy: -12.2 },
      k9: { dy: 11.1 }, k11: { dy: 12.3 }, k17: { dy: 11.1 }

    }
  },

  /* ---------- kéo dài đường trượt của một phần tử ---------- */
  /* tu: từ mốc cuộn nào trở đi; xCuoi: toạ độ ngang khi tới cuối trang.
     Giữ nguyên dáng chuyển động của bản gốc, chỉ cho đi xa hơn. */
  truot: {
    'index.html': [{ k: 'k102', tu: 5200, xCuoi: 5 }]
  },

  /* ---------- địa chỉ bản gốc → trang trong bản dựng lại ---------- */
  /* Dùng khi dữ liệu đo còn giữ liên kết trỏ về trang gốc. Giá trị kèm #tên là
     một đoạn của trang chủ chứ không phải trang riêng. */
  /* Địa chỉ ngoài cần đổi hướng. Bản mẫu để vài liên kết trỏ về trang soạn thảo
     của Readymag — bấm vào là văng ra ngoài site. */
  trangNgoai: {
    'https://my.readymag.com/edit/6473183/preview/': 'hoavarac.html',
    'https://my.readymag.com/edit/6473183/preview/4/': 'hoavarac.html'
  },

  maSo: 'u1457614830',
  trangGoc: {
    '6473183/': 'hoavarac.html',
    '6473183/moreevent/': 'event.html',
    '6473183/3/': 'archive.html',
    '6473183/visit/': 'visit.html',
    '6477513/': 'index.html',
    '6477513/aboutus/': 'index.html#aboutus',
    '6477513/project/': 'index.html#project',
    '6477513/event/': 'index.html#event',
    '6477513/archive/': 'index.html#archive'
  }
};
