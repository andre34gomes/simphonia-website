#!/usr/bin/env python3
"""
Simphonia — Development Server
==============================
Replicates production routing locally:
  • Real files and route shells                   → served as-is
  • Unknown routes                                → returns 404.html with HTTP 404

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
    """Serve real files directly; fall back to the branded 404 page."""

    def serve_custom_404(self):
        not_found_path = os.path.join(ROOT, '404.html')

        with open(not_found_path, 'rb') as file:
            content = file.read()

        self.send_response(404)
        self.send_header('Content-Type', self.guess_type(not_found_path))
        self.send_header('Content-Length', str(len(content)))
        self.end_headers()

        if self.command != 'HEAD':
            self.wfile.write(content)

    def serve_current_path(self):
        if self.command == 'HEAD':
            super().do_HEAD()
        else:
            super().do_GET()

    def handle_method(self):
        # Strip query string to get the filesystem path
        raw_path = self.path.split('?')[0].split('#')[0]
        fs_path = self.translate_path(raw_path)

        # 1. File exists → serve it
        if os.path.isfile(fs_path):
            self.serve_current_path()
            return

        # 2. Clean partial URL maps to an existing .html file → serve it
        html_fs_path = fs_path + '.html'
        if os.path.isfile(html_fs_path):
            self.path = raw_path + '.html'
            self.serve_current_path()
            return

        # 3. Directory with index.html → serve that index.html
        if os.path.isdir(fs_path):
            index = os.path.join(fs_path, 'index.html')
            if os.path.isfile(index):
                self.serve_current_path()
                return

        # 4. Unknown route → serve the branded 404 page
        self.serve_custom_404()

    def do_GET(self):
        self.handle_method()

    def do_HEAD(self):
        self.handle_method()

    def log_message(self, fmt, *args):
        # Colour-code status codes for readability
        code = args[1] if len(args) > 1 else ''
        colour = '\033[32m' if str(code).startswith('2') else \
                 '\033[33m' if str(code).startswith('3') else \
                 '\033[31m'
        reset = '\033[0m'
        print(f"  {colour}{args[1]}{reset}  {args[0]}")


class ReusableTCPServer(socketserver.TCPServer):
    allow_reuse_address = True


os.chdir(ROOT)

print(f"\n  \033[1mSimphonia dev server\033[0m")
print(f"  → http://localhost:{PORT}\n")

with ReusableTCPServer(("", PORT), SPAHandler) as httpd:
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n  Server stopped.")

