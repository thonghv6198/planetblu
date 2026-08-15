#!/usr/bin/env python3
"""Đo xem ô vuông ■ nằm ở đâu trong ảnh logo.

Kết quả điền vào `header.logo.oVuong` trong config.js; nhờ đó app.js tự phóng và
canh logo sao cho ô vuông của nó trùng cỡ, trùng hàng với ô vuông của các mục
điều hướng.

Chạy:
  python3 tools/do-logo.py                     # assets/logo.png
  python3 tools/do-logo.py assets/logo-2.png
"""
import os, subprocess, sys

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
sys.path.insert(0, os.path.join(ROOT, 'tools'))
from diff import load

ANH = sys.argv[1] if len(sys.argv) > 1 else 'assets/logo.png'
DUONG = ANH if os.path.isabs(ANH) else os.path.join(ROOT, ANH)

# Nền trong suốt bị đọc thành đen, nên ghép lên nền trắng trước khi dò.
TAM = os.path.join(ROOT, 'shots', '_logo-tam.png')
os.makedirs(os.path.dirname(TAM), exist_ok=True)
subprocess.run(['sips', '-s', 'format', 'png', DUONG, '--out', TAM],
               capture_output=True, check=True)
w, h, n, d = load(TAM)


def toi(x, y):
    i = (y * w + x) * n
    if n == 4 and d[i + 3] < 128:
        return False          # trong suốt thì coi như nền
    return d[i] < 100


# Với mỗi cột, tìm đoạn mực liền mạch dài nhất — ô vuông đặc nên đoạn này chạy
# suốt chiều cao của nó, còn nét chữ rỗng ruột thì đứt quãng.
doan = []
for x in range(w):
    dai, d0, d1, dem, bd = 0, 0, 0, 0, 0
    for y in range(h + 1):
        if y < h and toi(x, y):
            if dem == 0:
                bd = y
            dem += 1
        else:
            if dem > dai:
                dai, d0, d1 = dem, bd, y - 1
            dem = 0
    doan.append((dai, d0, d1))

cao_nhat = max(q[0] for q in doan)
# cột thuộc ô vuông: đoạn mực dài gần bằng cột dày nhất
thuoc = [x for x in range(w) if doan[x][0] > cao_nhat * 0.9]

# gom thành các dải liền mạch, lấy dải rộng nhất nằm xa nhất bên phải
dai_cot = []
for x in thuoc:
    if dai_cot and x == dai_cot[-1][-1] + 1:
        dai_cot[-1].append(x)
    else:
        dai_cot.append([x])
rong = [r for r in dai_cot if len(r) > 8] or dai_cot
o = rong[-1]

x0, x1 = o[0], o[-1]
y0, y1 = doan[(x0 + x1) // 2][1], doan[(x0 + x1) // 2][2]
os.remove(TAM)

print('%s — %dx%d' % (ANH, w, h))
print('ô vuông: x %d..%d (rộng %d)  y %d..%d (cao %d)'
      % (x0, x1, x1 - x0 + 1, y0, y1, y1 - y0 + 1))
print()
print('điền vào config.js:')
print('  oVuong: { tren: %.4f, duoi: %.4f }' % (y0 / h, (y1 + 1) / h))
