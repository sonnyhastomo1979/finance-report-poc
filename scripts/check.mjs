import { readdir } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const root = fileURLToPath(new URL("..", import.meta.url));
async function sources(directory) {
  const result = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if ([".git", "node_modules", "dist"].includes(entry.name)) continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) result.push(...(await sources(path)));
    else if (entry.name.endsWith(".mjs")) result.push(path);
  }
  return result;
}
const files = await sources(root);
for (const file of files) {
  const check = spawnSync(process.execPath, ["--check", file], {
    stdio: "inherit",
  });
  if (check.error) throw check.error;
  if (check.status !== 0) process.exit(check.status ?? 1);
}
console.log(`Syntax checked ${files.length} JavaScript modules.`);
