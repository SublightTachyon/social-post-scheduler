#!/usr/bin/env python3
import http.server
import socketserver
import os
from pathlib import Path
from urllib.parse import urlparse

PORT = int(os.environ.get("IMAGE_SERVER_PORT", 3000))
IMAGES_DIR = os.path.join(os.path.dirname(__file__), "data", "images")

class ImageHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        # Only serve /images/* paths
        if not self.path.startswith("/images/"):
            self.send_response(404)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(b'{"error": "Not found"}')
            return

        # Extract filename and prevent directory traversal
        filename = os.path.basename(self.path)
        file_path = os.path.join(IMAGES_DIR, filename)

        # Security check: ensure the file is within IMAGES_DIR
        try:
            file_path = os.path.realpath(file_path)
            images_dir_real = os.path.realpath(IMAGES_DIR)
            if not file_path.startswith(images_dir_real):
                self.send_response(403)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(b'{"error": "Forbidden"}')
                return
        except Exception:
            self.send_response(403)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(b'{"error": "Forbidden"}')
            return

        # Try to serve the file
        if not os.path.exists(file_path):
            self.send_response(404)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(b'{"error": "File not found"}')
            return

        # Guess content type
        ext = Path(file_path).suffix.lower()
        content_type_map = {
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".png": "image/png",
            ".gif": "image/gif",
            ".webp": "image/webp"
        }
        content_type = content_type_map.get(ext, "application/octet-stream")

        try:
            with open(file_path, "rb") as f:
                data = f.read()
            self.send_response(200)
            self.send_header("Content-Type", content_type)
            self.send_header("Content-Length", len(data))
            self.end_headers()
            self.wfile.write(data)
        except Exception as e:
            self.send_response(500)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(b'{"error": "Internal server error"}')

if __name__ == "__main__":
    with socketserver.TCPServer(("", PORT), ImageHandler) as httpd:
        print(f"Image server listening on http://localhost:{PORT}/images")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServer stopped.")
