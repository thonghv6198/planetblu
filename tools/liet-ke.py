#!/usr/bin/env python3
"""Liệt kê mã phần tử của một trang, để biết kNN nào ứng với chữ nào.

Dùng khi cần điền các mục trong config.js (nhay, chinh, xemTruoc, truot).

Chạy:
  python3 tools/liet-ke.py                → trang chủ
  python3 tools/liet-ke.py hoavarac       → trang Hoa và rác
  python3 tools/liet-ke.py visit anh      → chỉ liệt kê ảnh của trang Visit
"""
import json, os, re, sys

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
TEN = sys.argv[1] if len(sys.argv) > 1 else ''
LOC = sys.argv[2] if len(sys.argv) > 2 else ''

DAT = os.path.join(ROOT, 'data-%s.js' % TEN if TEN else 'data.js')
if not os.path.exists(DAT):
    print('không có', os.path.basename(DAT))
    co = sorted(f for f in os.listdir(ROOT) if f.startswith('data') and f.endswith('.js'))
    print('các trang hiện có:', ', '.join(c[5:-3] or '(trang chủ)' for c in co if 'mobile' not in c))
    sys.exit(1)

raw = open(DAT).read()
D = json.loads(raw[raw.index('{'):raw.rindex(';')])

print('%s — %d phần tử, quỹ đạo cuộn tới %s' %
      (os.path.basename(DAT), len(D['items']), D['maxY']))
print()
print('%-6s %-9s %-9s %-9s %s' % ('mã', 'ngang', 'dọc', 'rộng', 'nội dung'))
print('-' * 74)

for it in sorted(D['items'], key=lambda i: i['tr'][0][2]):
    m = it['tr'][0]
    if it.get('tag') == 'img' or it.get('bg'):
        loai, mo_ta = 'anh', '[ảnh] ' + os.path.basename(it.get('src') or '')[:40]
    elif it.get('video'):
        loai, mo_ta = 'video', '[video]'
    elif it.get('svg'):
        loai, mo_ta = 'svg', '[nét vẽ]'
    else:
        loai = 'chu'
        mo_ta = re.sub(r'<[^>]*>', ' ', it.get('html') or '')
        mo_ta = re.sub(r'\s+', ' ', mo_ta).strip()[:46]
    if LOC and LOC != loai:
        continue
    print('%-6s %-9.1f %-9.1f %-9.1f %s' % (it['k'], m[1], m[2], m[3], mo_ta))
