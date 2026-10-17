import assert from "node:assert/strict";
import { once } from "node:events";
import test from "node:test";
import { createReportServer } from "../server.mjs";

test("the report and all browser modules are served; private files and writes are refused", async () => {
  const server = createReportServer();
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const origin = `http://127.0.0.1:${server.address().port}`;
  try {
    const home = await fetch(origin);
    assert.equal(home.status, 200);
    assert.match(await home.text(), /Monthly expenses/);
    for (const asset of [
      "styles.css",
      "app.mjs",
      "report.mjs",
      "expenses.mjs",
    ]) {
      const response = await fetch(`${origin}/${asset}`);
      assert.equal(response.status, 200);
      assert.ok((await response.text()).length > 0);
    }
    for (const path of [
      "/.env",
      "/package.json",
      "/.git/config",
      "/%2e%2e/server.mjs",
    ]) {
      const response = await fetch(`${origin}${path}`);
      assert.equal(response.status, 404);
      await response.body.cancel();
    }
    const head = await fetch(origin, { method: "HEAD" });
    assert.equal(head.status, 200);
    assert.equal(await head.text(), "");
    const write = await fetch(origin, { method: "POST", body: "not accepted" });
    assert.equal(write.status, 405);
    await write.body.cancel();
  } finally {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }
});
