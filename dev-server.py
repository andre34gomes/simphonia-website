#!/usr/bin/env python3
"""
Simphonia — SPA Development Server
====================================
Replicates the Netlify/Vercel catch-all rule locally:
  • Real files  (CSS, JS, images, HTML partials) → served as-is
  • Everything else (SPA routes)                  → returns index.html

Usage:
    python dev-server.py          # serves on http://localhost:8080
    python dev-server.py 3000     # custom port
"""

import http.server
import socketserver
import os
import sys

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
ROOT = os.path.dirname(os.path.abspath(__file__))


class SPAHandler(http.server.SimpleHTTPRequestHandler):
    """Serve real files directly; fall back to index.html for SPA routes."""

    def do_GET(self):
        # Strip query string to get the filesystem path
        raw_path = self.path.split('?')[0].split('#')[0]
        fs_path = self.translate_path(raw_path)

        # 1. File exists → serve it
        if os.path.isfile(fs_path):
            super().do_GET()
            return

        # 2. Directory with index.html → serve that index.html
        if os.path.isdir(fs_path):
            index = os.path.join(fs_path, 'index.html')
            if os.path.isfile(index):
                super().do_GET()
                return

        # 3. SPA catch-all → serve the app shell
        self.path = '/index.html'
        super().do_GET()

    def log_message(self, fmt, *args):
        # Colour-code status codes for readability
        code = args[1] if len(args) > 1 else ''
        colour = '\033[32m' if str(code).startswith('2') else \
                 '\033[33m' if str(code).startswith('3') else \
                 '\033[31m'
        reset = '\033[0m'
        print(f"  {colour}{args[1]}{reset}  {args[0]}")


os.chdir(ROOT)

print(f"\n  \033[1mSimphonia dev server\033[0m")
print(f"  → http://localhost:{PORT}\n")

with socketserver.TCPServer(("", PORT), SPAHandler) as httpd:
    httpd.allow_reuse_address = True
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n  Server stopped.")

