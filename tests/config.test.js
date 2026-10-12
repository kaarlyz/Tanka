const test = require("node:test");
const assert = require("node:assert/strict");
const { validateConfigOnStartup } = require("../server/config");

test("Config: validateConfigOnStartup melaporkan status tanpa membocorkan secret", () => {
  const cfg = validateConfigOnStartup();
  assert.ok(typeof cfg.PORT === "number");
  assert.ok(typeof cfg.ROUTER_URL === "string");
  assert.ok(typeof cfg.ROUTER_KEY_CONFIGURED === "boolean");
  // Pastikan token mentah tidak terekspos di object return
  assert.equal(cfg.ROUTER_KEY, undefined);
});
