#!/usr/bin/env python3
"""Tạo một trang tác phẩm mới dùng lại bố cục có sẵn, chỉ đổi tên.

Nhân bản dữ liệu của một trang đang có (mặc định: Hoa và rác) rồi thay tiêu đề.
Ảnh và các phần bên trong giữ nguyên — thay sau bằng tools/doi-anh.py hoặc sửa
thẳng trong data-<slug>.js.

Chạy:
  python3 tools/tao-trang.py <slug> "<Tên hiển thị>" [trang-mẫu]

Ví dụ:
  python3 tools/tao-trang.py songnuoc "Sông nước"
  python3 tools/tao-trang.py songnuoc "Sông nước" giants

Xong nhớ thêm mục vào menuXo trong config.js để bấm tới được trang mới.
"""
import json, os, re, sys

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')

if len(sys.argv) < 3:
    print(__doc__)
    sys.exit(1)

SLUG = sys.argv[1].strip().lower()
TEN = sys.argv[2].strip()
MAU = sys.argv[3].strip() if len(sys.argv) > 3 else 'hoavarac'

if not re.fullmatch(r'[a-z0-9-]+', SLUG):
    print('slug chỉ gồm chữ thường, số và dấu gạch ngang')
    sys.exit(1)


def doi_tieu_de(src, dst, bien):
    """Chép dữ liệu, thay khối chữ tiêu đề bằng tên mới."""
    raw = open(os.path.join(ROOT, src)).read()
    D = json.loads(raw[raw.index('{'):raw.rindex(';')])

    # Tiêu đề là khối chữ có cỡ lớn nhất trên trang
    to_nhat, co = None, 0
    for it in D['items']:
        if not (it.get('html') or '').strip():
            continue
        fs = float(((it.get('st') or {}).get('fs') or '0').replace('px', '') or 0)
        if fs > co:
            co, to_nhat = fs, it

    doi = 0
    if to_nhat is not None:
        cu = re.sub(r'<[^>]*>', '', to_nhat['html'])
        cu = re.sub(r'█|\s+$', '', cu).strip()
        if cu:
            for it in D['items']:
                h = it.get('html') or ''
                if cu in h:
                    it['html'] = h.replace(cu, TEN)
                    doi += 1

    out = os.path.join(ROOT, dst)
    open(out, 'w').write(bien + ' = ' +
                         json.dumps(D, ensure_ascii=False, separators=(',', ':')) + ';\n')
    return cu if to_nhat is not None else '', doi


cu, n1 = doi_tieu_de('data-%s.js' % MAU, 'data-%s.js' % SLUG, 'window.PB_D')
_, n2 = doi_tieu_de('data-mobile-%s.js' % MAU, 'data-mobile-%s.js' % SLUG, 'window.PB_M')

html = open(os.path.join(ROOT, '%s.html' % MAU)).read()
html = (html.replace('data-%s.js' % MAU, 'data-%s.js' % SLUG)
            .replace('data-mobile-%s.js' % MAU, 'data-mobile-%s.js' % SLUG))
html = re.sub(r'<title>.*?</title>', '<title>%s — planetBLU</title>' % TEN, html)
open(os.path.join(ROOT, '%s.html' % SLUG), 'w').write(html)

print('đã tạo %s.html, data-%s.js, data-mobile-%s.js' % (SLUG, SLUG, SLUG))
print('đổi tiêu đề "%s" → "%s" (%d khối máy tính, %d khối điện thoại)' % (cu, TEN, n1, n2))
print()
print('còn lại: thêm vào menuXo trong config.js —')
print("  { under: ['Project', 'Archive', 'Visit'], x: 104.1, y: 52, w: 76, h: 14, fs: 8,")
print("    text: '%s █', trang: '%s.html' }," % (TEN, SLUG))
