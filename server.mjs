import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = fileURLToPath(new URL(".", import.meta.url));
const assets = new Map([
  ["/", ["index.html", "text/html; charset=utf-8"]],
  ["/index.html", ["index.html", "text/html; charset=utf-8"]],
  ["/styles.css", ["styles.css", "text/css; charset=utf-8"]],
  ["/app.mjs", ["app.mjs", "text/javascript; charset=utf-8"]],
  ["/report.mjs", ["report.mjs", "text/javascript; charset=utf-8"]],
  ["/expenses.mjs", ["expenses.mjs", "text/javascript; charset=utf-8"]],
]);

export function createReportServer(directory = resolve(root, "public")) {
  return createServer(async (request, response) => {
    const pathname = new URL(request.url ?? "/", "http://localhost").pathname;
    const asset = assets.get(pathname);
    if (!["GET", "HEAD"].includes(request.method)) {
      response.writeHead(405, { allow: "GET, HEAD" });
      response.end();
      return;
    }
    if (!asset) {
      response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
      response.end("Not found");
      return;
    }
    try {
      const content = await readFile(resolve(directory, asset[0]));
      response.writeHead(200, {
        "content-type": asset[1],
        "content-length": content.length,
        "cache-control": "no-store",
        "x-content-type-options": "nosniff",
      });
      response.end(request.method === "HEAD" ? undefined : content);
    } catch {
      response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
      response.end("Asset unavailable. Run npm run build before using --dist.");
    }
  });
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  const port = Number(process.env.PORT ?? 4173);
  const directory = resolve(
    root,
    process.argv.includes("--dist") ? "dist" : "public",
  );
  const server = createReportServer(directory);
  server.listen(port, "127.0.0.1", () => {
    console.log(`Finance Report POC: http://localhost:${port}`);
  });
  for (const signal of ["SIGINT", "SIGTERM"])
    process.on(signal, () => server.close());
}
