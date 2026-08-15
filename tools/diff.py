#!/usr/bin/env python3
"""So khớp ảnh chụp bản gốc và bản dựng lại: báo độ lệch trung bình từng mốc.

Không dùng thư viện ngoài — đọc JPEG bằng `sips` để chuyển sang PNG thô rồi
so từng khối 8×8 pixel. Đủ để phát hiện lệch vị trí và thiếu phần tử.
"""
import subprocess, sys, os, struct, zlib

SHOTS = os.path.join(os.path.dirname(__file__), '..', 'shots')


def load(path):
    """Đọc ảnh về dạng (rộng, cao, bytes RGB) qua PNG trung gian."""
    png = path + '.png'
    subprocess.run(['sips', '-s', 'format', 'png', path, '--out', png],
                   capture_output=True, check=True)
    data = open(png, 'rb').read()
    os.remove(png)
    pos, w, h, bd, ct = 8, 0, 0, 0, 0
    idat = b''
    while pos < len(data):
        ln = struct.unpack('>I', data[pos:pos + 4])[0]
        typ = data[pos + 4:pos + 8]
        body = data[pos + 8:pos + 8 + ln]
        if typ == b'IHDR':
            w, h, bd, ct = struct.unpack('>IIBB', body[:10])
        elif typ == b'IDAT':
            idat += body
        pos += 12 + ln
    raw = zlib.decompress(idat)
    ch = {0: 1, 2: 3, 4: 2, 6: 4}[ct]
    stride = w * ch
    out = bytearray(h * stride)
    prev = bytearray(stride)
    p = 0
    for y in range(h):
        f = raw[p]; p += 1
        line = bytearray(raw[p:p + stride]); p += stride
        if f == 1:
            for i in range(ch, stride): line[i] = (line[i] + line[i - ch]) & 255
        elif f == 2:
            for i in range(stride): line[i] = (line[i] + prev[i]) & 255
        elif f == 3:
            for i in range(stride):
                a = line[i - ch] if i >= ch else 0
                line[i] = (line[i] + ((a + prev[i]) >> 1)) & 255
        elif f == 4:
            for i in range(stride):
                a = line[i - ch] if i >= ch else 0
                b = prev[i]
                c = prev[i - ch] if i >= ch else 0
                pa, pb, pc = abs(b - c), abs(a - c), abs(a + b - 2 * c)
                pr = a if (pa <= pb and pa <= pc) else (b if pb <= pc else c)
                line[i] = (line[i] + pr) & 255
        out[y * stride:(y + 1) * stride] = line
        prev = line
    return w, h, ch, bytes(out)


def compare(a, b, step=8):
    wa, ha, ca, da = load(a)
    wb, hb, cb, db = load(b)
    w, h = min(wa, wb), min(ha, hb)
    tot = n = 0
    for y in range(0, h, step):
        for x in range(0, w, step):
            ia = (y * wa + x) * ca
            ib = (y * wb + x) * cb
            d = abs(da[ia] - db[ib]) + abs(da[ia + 1] - db[ib + 1]) + abs(da[ia + 2] - db[ib + 2])
            tot += d
            n += 1
    return tot / n / 3 / 255 * 100


if __name__ == '__main__':
    marks = sys.argv[1:] or ['0', '900', '1800', '2300', '3200', '4200', '5200', '5641']
    print('mốc      lệch trung bình')
    worst = []
    for m in marks:
        a = os.path.join(SHOTS, 'orig-%s.jpeg' % m)
        b = os.path.join(SHOTS, 'mine-%s.jpeg' % m)
        if not (os.path.exists(a) and os.path.exists(b)):
            continue
        d = compare(a, b)
        worst.append((d, m))
        print('%-8s %.2f%%' % (m, d))
    worst.sort(reverse=True)
    print('\nlệch nhiều nhất:', ', '.join('%s (%.1f%%)' % (m, d) for d, m in worst[:3]))
