const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const fs = require("node:fs");
const { getPythonBin, executePythonScript, executePythonScriptAsync } = require("../server/utils/pythonResolver");

test("Python Resolver: getPythonBin returns executable interpreter", () => {
  const bin = getPythonBin();
  assert.ok(bin, "Python binary harus ada");
  assert.ok(typeof bin === "string" && bin.length > 0);
});

test("Python Resolver: eksekusi skrip python sederhana berhasil", () => {
  const tmpScript = path.join(__dirname, "tmp_test_resolver.py");
  fs.writeFileSync(tmpScript, "import sys\nprint('HELLO_TANKA_PYTHON')\nsys.exit(0)\n");

  try {
    const res = executePythonScript(tmpScript, [], { timeout: 10000 });
    assert.equal(res.success, true);
    assert.equal(res.stdout, "HELLO_TANKA_PYTHON");
  } finally {
    if (fs.existsSync(tmpScript)) fs.unlinkSync(tmpScript);
  }
});

test("Python Resolver: menangani skrip tidak ditemukan dengan aman", () => {
  const res = executePythonScript("/path/to/non_existent_script.py");
  assert.equal(res.success, false);
  assert.ok(res.error.includes("tidak ditemukan"));
});

test("Python Resolver: menangani exit error atau exception python", () => {
  const tmpScript = path.join(__dirname, "tmp_error_resolver.py");
  fs.writeFileSync(tmpScript, "import sys\nsys.stderr.write('CRITICAL_ERR')\nsys.exit(1)\n");

  try {
    const res = executePythonScript(tmpScript, [], { timeout: 10000 });
    assert.equal(res.success, false);
    assert.ok(res.error.includes("CRITICAL_ERR"));
  } finally {
    if (fs.existsSync(tmpScript)) fs.unlinkSync(tmpScript);
  }
});

test("Python Resolver: eksekusi asynchronous executePythonScriptAsync berhasil", async () => {
  const tmpScript = path.join(__dirname, "tmp_test_async.py");
  fs.writeFileSync(tmpScript, "import sys\nprint('ASYNC_TANKA_OK')\nsys.exit(0)\n");

  try {
    const res = await executePythonScriptAsync(tmpScript, [], { timeout: 10000 });
    assert.equal(res.success, true);
    assert.equal(res.stdout, "ASYNC_TANKA_OK");
  } finally {
    if (fs.existsSync(tmpScript)) fs.unlinkSync(tmpScript);
  }
});
