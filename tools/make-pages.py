#!/usr/bin/env python3
"""Sinh file HTML cho từng trang con, dùng chung app.js và style.css.

Mỗi trang là một file .html nằm ngay cạnh index.html, nạp đúng bộ dữ liệu của nó
(bản máy tính và bản điện thoại).
Chạy: python3 tools/make-pages.py
"""
import os, json

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)

# tên file → (tên dữ liệu, tiêu đề)
# 'Giants' trong menu bản gốc chưa có trang riêng — nó dẫn về trang Event
PAGES = {
    'hoavarac': ('hoavarac',    'Hoa và rác — planetBLU'),
    'event':    ('moreevent',   'Event — planetBLU'),
    'archive':  ('archivemore', 'Archive — planetBLU'),
    'visit':    ('visit',       'Visit — planetBLU'),
}

TPL = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<link rel="stylesheet" href="fonts/inter.css">
<link rel="stylesheet" href="style.css">
</head>
<body>
<main id="stage" aria-label="planetBLU"></main>
<div id="spacer" aria-hidden="true"></div>
<script src="data-{data}.js"></script>
<script src="data-mobile-{data}.js"></script>
<script src="app.js"></script>
</body>
</html>
"""

made = []
for ten, (data, title) in PAGES.items():
    if not os.path.exists(f'data-{data}.js'):
        print('bỏ qua', ten, '— chưa có data-%s.js' % data)
        continue
    open(ten + '.html', 'w').write(TPL.format(title=title, data=data))
    made.append(ten + '.html')

print('đã sinh trang:', ', '.join(made) if made else '(chưa có trang nào)')
