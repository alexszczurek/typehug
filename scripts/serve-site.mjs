import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = fileURLToPath(new URL("../site/dist/", import.meta.url));
const port = Number(process.env.TYPEHUG_PREVIEW_PORT || 4173);
const types = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".md": "text/markdown", ".svg": "image/svg+xml", ".xml": "application/rss+xml" };

createServer(async (request, response) => {
  if (request.method !== "GET" && request.method !== "HEAD") {
    response.writeHead(405, { Allow: "GET, HEAD" });
    response.end();
    return;
  }
  let filename;
  try {
    const pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
    filename = path.resolve(root, `.${pathname.endsWith("/") ? `${pathname}index.html` : pathname}`);
    if (!filename.startsWith(root) || filename.includes("\0")) throw new Error("Invalid path");
  } catch {
    response.writeHead(400);
    response.end("Bad request");
    return;
  }
  try {
    if (!(await stat(filename)).isFile()) throw new Error("Not a file");
    const body = await readFile(filename);
    response.writeHead(200, {
      "Content-Type": `${types[path.extname(filename)] || "application/octet-stream"}; charset=utf-8`,
      "Content-Length": body.length,
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    });
    response.end(request.method === "HEAD" ? undefined : body);
  } catch {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
  }
}).listen(port, "127.0.0.1", () => {
  console.log(`Typehug preview: http://127.0.0.1:${port}`);
});
