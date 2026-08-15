#!/usr/bin/env python3
"""Máy chủ tĩnh cho bản dựng lại, kèm điểm nhận POST /__save/<tên> để lưu dữ liệu đo về đĩa."""
import http.server, socketserver, os, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
PORT = 8811


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=str(ROOT), **kw)

    def do_POST(self):
        if not self.path.startswith('/__save/'):
            self.send_error(404)
            return
        name = os.path.basename(self.path[len('/__save/'):]) or 'dump.json'
        body = self.rfile.read(int(self.headers.get('Content-Length', 0)))
        (ROOT / name).write_bytes(body)
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Content-Length', '2')
        self.end_headers()
        self.wfile.write(b'ok')

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Headers', '*')
        self.end_headers()

    def end_headers(self):
        if self.command == 'GET':
            self.send_header('Access-Control-Allow-Origin', '*')
        super().end_headers()

    def log_message(self, *a):
        pass


if __name__ == '__main__':
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(('127.0.0.1', PORT), Handler) as srv:
        print('phục vụ', ROOT, 'tại cổng', PORT)
        srv.serve_forever()
