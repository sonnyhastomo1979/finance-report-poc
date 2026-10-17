import { cp, readFile, mkdir, rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

const root = fileURLToPath(new URL("..", import.meta.url));
const output = resolve(root, "dist");
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await cp(resolve(root, "public"), output, { recursive: true });
for (const file of [
  "index.html",
  "styles.css",
  "app.mjs",
  "report.mjs",
  "expenses.mjs",
]) {
  if (!(await readFile(resolve(output, file))).length)
    throw new Error(`Empty build asset: ${file}`);
}
console.log(
  "Built the finance report into dist/. Preview with npm run preview.",
);
