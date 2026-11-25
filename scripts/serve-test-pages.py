#!/usr/bin/env python3
# Simple HTTP server for the aggregator test pages
import http.server
import socketserver
import os
import sys

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8765
DIR = os.path.dirname(os.path.abspath(__file__))

# Bind to all interfaces so the Next.js server can reach it via the public IP
# (the aggregator has an SSRF guard that blocks localhost / 127.x).
class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIR, **kwargs)
    def end_headers(self):
        self.send_header('Content-Type', 'text/html; charset=utf-8')
        super().end_headers()

with socketserver.TCPServer(("0.0.0.0", PORT), Handler) as httpd:
    print(f"Serving {DIR} on 0.0.0.0:{PORT}")
    httpd.serve_forever()
