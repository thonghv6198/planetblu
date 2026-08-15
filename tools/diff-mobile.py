#!/usr/bin/env python3
"""So ảnh chụp mobile giữa bản gốc và bản dựng lại.
Chạy: python3 tools/diff-mobile.py
"""
import os, sys, glob
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from diff import compare

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)

PAGES = [('', 'trang chính'), ('-hoavarac', 'Hoa và rác'), ('-event', 'Event'),
         ('-archive', 'Archive'), ('-visit', 'Visit')]
MARKS = [0, 800, 1600, 2400]

print('trang            mốc     lệch')
for suffix, ten in PAGES:
    for y in MARKS:
        a = f'shots/m{suffix}-{y}-orig.jpeg'
        b = f'shots/m{suffix}-{y}-mine.jpeg'
        if not (os.path.exists(a) and os.path.exists(b)):
            continue
        print('%-16s %-6s %.2f%%' % (ten, y, compare(a, b)))
