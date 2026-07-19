import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const imagesDir = path.resolve(__dirname, "..", "data", "images");
const PORT = process.env.IMAGE_SERVER_PORT || 3000;

const server = http.createServer((req, res) => {
  // Only serve /images/* paths
  if (!req.url.startsWith("/images/")) {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not found" }));
    return;
  }

  // Extract filename and prevent directory traversal
  const filename = path.basename(req.url);
  const filePath = path.join(imagesDir, filename);

  // Security check: ensure the file is within imagesDir
  if (!filePath.startsWith(imagesDir)) {
    res.writeHead(403, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Forbidden" }));
    return;
  }

  // Try to serve the file
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "File not found" }));
      return;
    }

    // Guess content type
    const ext = path.extname(filePath).toLowerCase();
    const contentTypeMap = {
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".gif": "image/gif",
      ".webp": "image/webp"
    };

    const contentType = contentTypeMap[ext] || "application/octet-stream";
    res.writeHead(200, { "Content-Type": contentType });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`Image server listening on http://localhost:${PORT}/images`);
});
