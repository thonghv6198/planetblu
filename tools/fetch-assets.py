#!/usr/bin/env python3
"""Tải về mọi ảnh mà các trang đã đo còn thiếu, đặt tên theo định dạng thật.

Quét tất cả measured*.json, đối chiếu với assets/manifest.json rồi tải phần thiếu.
Chạy: python3 tools/fetch-assets.py
"""
import json, hashlib, re, os, glob, subprocess, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)

man_path = 'assets/manifest.json'
man = json.load(open(man_path)) if os.path.exists(man_path) else {}

need = {}
for src_file in sorted(glob.glob('measured*.json')):
    M = json.load(open(src_file))
    for k, n in M['base']['style'].items():
        s = n.get('src')
        if not s or s.startswith('data:') or s in man or s in need:
            continue
        base = re.sub(r'.*/', '', s.split('?')[0])
        ext = os.path.splitext(base)[1] or '.jpg'
        h = hashlib.md5(s.encode()).hexdigest()[:8]
        need[s] = re.sub(r'[^A-Za-z0-9._-]', '_', os.path.splitext(base)[0])[:40] + '-' + h + ext

print('ảnh cần tải thêm:', len(need))
ok = fail = 0
for url, fn in need.items():
    out = os.path.join('assets', fn)
    r = subprocess.run(['curl', '-sS', '-L', '--max-time', '40',
                        '-A', 'Mozilla/5.0', '-e', 'https://readymag.website/',
                        '-o', out, url], capture_output=True)
    if r.returncode != 0 or not os.path.exists(out) or os.path.getsize(out) < 100:
        print('  hỏng:', fn)
        fail += 1
        continue
    # đặt lại đuôi theo định dạng thật — phần lớn ảnh Readymag là WebP dù URL ghi .jpg
    head = open(out, 'rb').read(16)
    real = ('.webp' if head[:4] == b'RIFF' and head[8:12] == b'WEBP'
            else '.jpg' if head[:3] == b'\xff\xd8\xff'
            else '.png' if head[:8] == b'\x89PNG\r\n\x1a\n' else None)
    if real and not fn.endswith(real):
        new = os.path.splitext(fn)[0] + real
        os.rename(out, os.path.join('assets', new))
        fn = new
    man[url] = fn
    ok += 1

json.dump(man, open(man_path, 'w'), indent=1)
print('đã tải:', ok, '| hỏng:', fail, '| tổng trong danh mục:', len(man))
