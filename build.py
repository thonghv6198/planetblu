#!/usr/bin/env python3
"""Dựng lại một trang planetBLU từ số liệu đo được của bản gốc.

Chạy:
  python3 build.py            → trang chính: measured.json     → data.js
  python3 build.py <tên>      → trang con:   measured-<tên>.json → data-<tên>.js

measured.json gồm:
  base.style   – nội dung + style tĩnh của từng phần tử (khoá k0, k1, …)
  base.stack   – [z-index hiệu dụng, thứ tự trong DOM] → quyết định ai che ai
  base.docH    – chiều cao tài liệu của bản gốc
  factors      – hệ số quy đổi toạ độ DOM sang toạ độ màn hình thật
  lines        – vị trí ngắt dòng thật của từng khối chữ
  frames       – vị trí/kích thước/độ mờ của từng phần tử tại mỗi mốc cuộn 50px

Đầu ra: data.js (dữ liệu cho app.js).
"""
import json, re, os, html, sys

NAME = sys.argv[1] if len(sys.argv) > 1 else ''
SRC = f'measured-{NAME}.json' if NAME else 'measured.json'
DST = f'data-{NAME}.js' if NAME else 'data.js'

# Bản gốc có hai bố cục: canvas 1024×608 cho máy tính, 320×568 cho điện thoại.
MOBILE = NAME.startswith('mobile')
CANVAS_W, CANVAS_H = (320.0, 568.0) if MOBILE else (1024.0, 608.0)
BASE_W, BASE_H = (375.0, 812.0) if MOBILE else (1440.0, 900.0)
ZOOM = BASE_W / CANVAS_W   # hệ số phóng của lớp ảnh khi đo

M = json.load(open(SRC))
style = M['base']['style']
stack = M['base']['stack']
factors = M['factors']
lines = M['lines']
frames = M['frames']
DOC_H = float(M['base']['docH'])
manifest = json.load(open('assets/manifest.json'))
SLIDES = f'slides-{NAME}.json' if NAME else 'slides.json'
shows = json.load(open(SLIDES))['shows'] if os.path.exists(SLIDES) else []
# Khối chữ nào của bản gốc đổi diện mạo khi rê chuột — dò bằng tools/hover-scan.js.
# Bố cục điện thoại không có chuột nên dùng chung kết quả của bản máy tính.
HOVER_SRC = 'hover-%s.json' % NAME.replace('mobile-', '') if NAME.replace('mobile-', '') else 'hover.json'
hover = json.load(open(HOVER_SRC)) if os.path.exists(HOVER_SRC) else {}
# Khoảng cách từ ô vuông tới mép phải khối, đo thẳng trên bản gốc bằng
# tools/box-scan.js. Dựng lại bằng dấu cách thì lệch nửa pixel mỗi dấu.
BOX_SRC = 'box-%s.json' % NAME.replace('mobile-', '') if NAME.replace('mobile-', '') else 'box.json'
box = json.load(open(BOX_SRC)) if os.path.exists(BOX_SRC) else {}
# Độ đậm thật: Inter là font biến thiên, bản gốc chỉnh bằng trục `wght` chứ không
# dùng font-weight — đọc mỗi font-weight thì khối nào cũng ra 400. Đo bằng
# tools/wght-scan.js, khoá theo "cỡ chữ|chữ" chứ không theo mã kNN: mỗi lần mở
# trang Readymag lại dựng số phần tử khác nhau nên mã đánh ra lệch giữa hai lần.
WGHT_SRC = 'wght-%s.json' % NAME if NAME else 'wght.json'
wght = json.load(open(WGHT_SRC)) if os.path.exists(WGHT_SRC) else {}


def do_dam(n):
    t = re.sub(r'\s+', ' ', (n.get('text') or '').strip())[:60]
    if not t:
        return None
    return wght.get((n.get('fs') or '') + '|' + t)

# ── ngưỡng đổi đường dẫn, lấy từ chính lộ trình quan sát khi cuộn ──────────
routes, last = [], None
for f in frames:
    seg = f.get('path', '/').rstrip('/').split('/')[-1]
    seg = '/' if seg == '6477513' else '/%s/' % seg
    if seg != last:
        routes.append([f['y'], seg])
        last = seg

# ── bỏ phần tử nằm lồng trong phần tử khác (tránh vẽ hai lần) ─────────────
def cha_co_chu(c):
    n = style.get(c)
    return bool(n and (n.get('text') or '').strip())


skip = {k for k, v in style.items()
        if any(c in style and cha_co_chu(c) for c in v.get('parents') or [])}


# Bề rộng một dấu cách của Inter, tính theo cỡ chữ. Suy ra từ số đo trên bản gốc:
# 3,98px ở cỡ 12 và 14,33px ở cỡ 43, đều sau khi phóng — ra 0,2365 em.
RONG_DAU_CACH = 0.2365


def pad_cuoi(k, n):
    """Khoảng cách phải cần chừa để ô vuông về đúng cột của bản gốc.

    Bản gốc chèn dấu cách sau ô vuông. Dựng lại bằng dấu cách thì lệch nửa pixel
    mỗi dấu, nên bỏ dấu cách và chừa chỗ bằng padding tính theo cỡ chữ. Số đo
    thật (nếu có) được ưu tiên hơn công thức.
    """
    if k in box:
        return box[k]
    # Chỗ chừa này chỉ để đẩy ô vuông vào cột. Khối không có ô vuông (ví dụ nút
    # Order/Book) mà cũng chừa thì chữ bị lệch khỏi tâm nút.
    if '█' not in ((n.get('text') or '') + (n.get('inner') or '')):
        return None
    m = re.search(r'[ ]+$', n.get('text') or '')
    if not m:
        return None
    fs = float((n.get('fs') or '0').replace('px', '') or 0)
    return round(len(m.group()) * fs * RONG_DAU_CACH * ZOOM, 2) or None


def chi_phong(m):
    """Ma trận chỉ phóng đều, không xoay/lật/nghiêng — đó là lớp phóng của bản gốc.

    Nhận nhầm nó thành phép xoay thì khối chữ bị phóng thêm một lần nữa (bản gốc
    phóng bằng zoom ở lớp trong, ta lại nhân tiếp bằng transform ở lớp ngoài).
    """
    g = re.match(r'matrix\(([^)]+)\)', m or '')
    if not g:
        return False
    v = [float(x) for x in g.group(1).split(',')]
    return v[1] == 0 and v[2] == 0 and v[0] == v[3] and v[0] > 0


def factor(k):
    """Hệ số quy đổi DOM → màn hình. Đo thật; thiếu thì suy theo loại phần tử."""
    f = factors.get(k)
    if f:
        return f
    n = style[k]
    return ZOOM if (n['tag'] in ('IMG', 'VIDEO', 'svg') or n.get('isBg')) else 1.0


# ── gom quỹ đạo từng phần tử ──────────────────────────────────────────────
# Toạ độ đo trong hệ DOM; nhân hệ số để ra hệ màn hình. Khung cắt của trang
# nằm sẵn ở hệ màn hình nên giữ nguyên.
MARGIN = 120   # cho phép nhô ra ngoài chút ít để phần tử vào/ra khung mượt mà

tracks = {}
dropped = 0
for fr in frames:
    y = fr['y']
    for k, v in fr['items'].items():
        if k in skip or k not in style:
            continue
        f = factor(k)
        x0, y0 = v[0] * f, v[1] * f
        x1, y1 = x0 + v[2] * f, y0 + v[3] * f
        # bỏ phần tử nằm hẳn ngoài màn hình
        if x1 < -MARGIN or x0 > BASE_W + MARGIN or y1 < -MARGIN or y0 > BASE_H + MARGIN:
            dropped += 1
            continue
        # Bỏ phần tử mà phép dò điểm cho thấy không hiện: bản gốc đã cắt nó bằng
        # khung của trang dù toạ độ vẫn nằm trong màn hình. Video thì miễn trừ —
        # nó luôn bị lớp phủ nút phát che nên phép dò không bao giờ chạm tới.
        co_nen = style[k]['bgc'] not in ('rgba(0, 0, 0, 0)', 'transparent')
        if len(v) > 5 and v[5] == 0 and style[k]['tag'] not in ('VIDEO', 'svg') and not co_nen:
            dropped += 1
            continue
        tracks.setdefault(k, []).append([
            y, round(x0, 1), round(y0, 1),
            round(v[2] * f, 1), round(v[3] * f, 1), v[4],
            0, 0, 0, 0,
        ])


def local(src):
    if not src:
        return None
    fn = manifest.get(src)
    return 'assets/' + fn if fn else src


def content(k, n):
    """Nội dung bên trong: ảnh thì rỗng; chữ thì chốt cứng ngắt dòng của bản gốc.

    Trang này phóng to/thu nhỏ cả khối chứ không dàn lại chữ, nên ngắt dòng cố định
    đúng với cách bản gốc hiển thị ở mọi bề rộng cửa sổ.
    """
    if n['tag'] in ('IMG', 'VIDEO', 'svg') or n.get('isBg'):
        return ''
    # Khoảng trắng ở hai đầu là thật và có tác dụng: trang này để white-space
    # pre-wrap nên chúng đẩy ô vuông vào đúng cột. Cắt đi là ô vuông lệch ra.
    raw = n.get('text') or ''
    dau = (re.match(r'[ ]+', raw) or [''])[0] if re.match(r'[ ]+', raw) else ''
    m_cuoi = re.search(r'[ ]+$', raw)
    cuoi = '' if pad_cuoi(k, n) else (m_cuoi.group() if m_cuoi else '')

    if k in lines:
        than = '<br>'.join(html.escape(l.strip(' ')) for l in lines[k])
        return dau + than + cuoi
    inner = n.get('inner')
    if inner and '<' in inner:
        s = re.sub(r'<(?!/?(b|i|em|strong|br|span|a)\b)[^>]*>', '', inner)
        s = re.sub(r'\s(class|style|data-[\w-]+|id)="[^"]*"', '', s)
        # Xoá thẻ con xong hay còn lại cả mảng xuống dòng và thụt lề của bản gốc.
        # Giữ nguyên thì khối chữ phình ra vì trang này để white-space: pre-wrap.
        return dau + re.sub(r'\s+', ' ', s).strip() + cuoi
    return dau + html.escape(raw.strip()) + cuoi


def fixed_nav(k):
    """Phần tử đứng yên ở đỉnh trang suốt mọi mốc cuộn — tức thanh điều hướng."""
    tr = tracks[k]
    if len(tr) < len(frames) - 2:
        return False
    x0, y0 = tr[0][1], tr[0][2]
    if y0 > 80:
        return False
    return all(abs(t[1] - x0) < 1 and abs(t[2] - y0) < 1 for t in tr)


def paint_order(k):
    """Thứ tự vẽ của bản gốc: trang sau nằm trên trang trước, trong cùng một trang
    thì theo z-index, rồi tới thứ tự xuất hiện trong tài liệu."""
    z, o = stack.get(k, [0, int(k[1:])])
    return (style[k].get('page', -1), z, o)


# ── slideshow: giữ lại lớp ở giữa, gắn cả bộ ảnh; các lớp kề bị ẩn đi ──────
slide_of = {}     # khoá của lớp giữa -> danh sách ảnh
slide_drop = set()  # các lớp kề (prev/next) không cần vẽ
for sh in shows:
    urls = [i['url'] for i in sh['imgs'] if i['url']]
    if len(urls) < 2:
        continue
    center = next((i['url'] for i in sh['imgs'] if 'center-image' in i['cls']), urls[0])
    group = [k for k, n in style.items() if n.get('src') in urls and k in tracks]
    if not group:
        continue
    host = next((k for k in group if style[k]['src'] == center), group[0])
    # thứ tự trình chiếu bắt đầu từ ảnh đang hiển thị
    ordered = urls[urls.index(center):] + urls[:urls.index(center)]
    slide_of[host] = [local(u) for u in ordered]
    slide_drop |= set(group) - {host}


items = []
for k in sorted([k for k in style if k in tracks and k not in slide_drop], key=paint_order):
    n = style[k]
    f = factor(k)
    st = {
        'fs': n['fs'], 'fw': n['fw'], 'lh': n['lh'], 'ls': n['ls'],
        'color': n['color'], 'ta': n['ta'],
        # Cả trang dùng một bộ chữ Inter (tải sẵn trong fonts/), nên không cần
        # ghi lại font-family của từng phần tử — style.css lo phần đó.
        'z': n['z'] if n['z'] != 'auto' else None,
        'bgc': None if n['bgc'] in ('rgba(0, 0, 0, 0)', 'transparent') else n['bgc'],
        'td': None if n['td'] == 'none' else n['td'],
    }
    # Trên thanh điều hướng, bản gốc để ô vuông của "About us" rớt xuống dòng vì
    # khung hơi hẹp. Giữ nó nằm cùng dòng cho đều với các mục khác.
    html_ = content(k, n)
    mot_dong = fixed_nav(k) and '<br>' in html_
    if mot_dong:
        html_ = html_.replace('<br>', ' ')

    # Nút bấm của bản gốc là một ô nền đặc, chữ nằm ở phần tử con và căn giữa.
    # Phần tử con bị gộp vào cha nên phải mang cách căn giữa ấy lên cha.
    con_giua = [c for c, v in style.items()
                if k in (v.get('parents') or []) and v.get('ta') == 'center']
    nut = bool(con_giua) and n['bgc'] not in ('rgba(0, 0, 0, 0)', 'transparent')

    items.append({
        'k': k,
        'nut': nut or None,
        # rê chuột vào thì chữ và ô vuông cùng mờ đi, đúng như bản gốc
        'mo': True if hover.get(k) else None,
        'pad': pad_cuoi(k, n),
        'wght': do_dam(n),
        'tag': 'video' if n['tag'] == 'VIDEO' else 'img' if n['tag'] == 'IMG' else 'div',
        'src': local(n.get('src')),
        'bg': bool(n.get('isBg')),
        'bgPos': n.get('bgPos'),
        'fit': n.get('objFit'),
        'href': n.get('href'),
        'html': html_,
        'motDong': mot_dong or None,
        'nowrap': k in lines,
        'slides': slide_of.get(k),
        'video': n.get('video') or None,
        'svg': n.get('svg') or None,
        'xoay': None if chi_phong(n.get('xoay')) else (n.get('xoay') or None),
        'svgNet': n.get('svgNet') or None,
        # thanh điều hướng đứng yên suốt trang; bản gốc luôn vẽ nó trên cùng
        'fixed': fixed_nav(k),
        # widget chữ giữ nguyên cỡ chữ khai báo rồi phóng bằng zoom, đúng như bản gốc
        # Bản gốc luôn khai cỡ chữ nhỏ rồi phóng cả khối, kể cả những widget mà
        # toạ độ phải quy đổi (hệ số khác 1) — bỏ sót là chữ hiện ra bé hẳn.
        'zt': ZOOM if n['tag'] not in ('IMG', 'VIDEO', 'svg') and not n.get('isBg') else None,
        'st': {a: b for a, b in st.items() if b},
        'tr': tracks[k],
    })

data = {'baseW': BASE_W, 'baseH': BASE_H, 'docH': DOC_H,
        'canvasW': CANVAS_W, 'canvasH': CANVAS_H, 'mobile': MOBILE,
        'maxY': max(f['y'] for f in frames), 'routes': routes, 'items': items}
# Hai bố cục nạp song song vào hai biến riêng, app.js chọn theo bề rộng màn hình.
# Nhờ vậy trang mở được cả bằng file:// chứ không bắt buộc phải có máy chủ.
BIEN = 'window.PB_M' if MOBILE else 'window.PB_D'
open(DST, 'w').write(BIEN + ' = ' + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + ';\n')

print('phần tử dựng lại:', len(items))
print('bỏ qua (lồng nhau):', len(skip), '| lần xuất hiện ngoài màn hình bị cắt:', dropped)
print('chiều cao tài liệu:', DOC_H, '| mốc cuộn:', len(frames))
print('đường dẫn:', routes)
print(DST + ':', os.path.getsize(DST) // 1024, 'KB')
