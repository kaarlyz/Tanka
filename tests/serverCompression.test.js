const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const zlib = require("node:zlib");
const { server, getCompressionStream } = require("../server.js");

function httpRequest(options) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      const chunks = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          rawBody: Buffer.concat(chunks)
        });
      });
    });
    req.on("error", reject);
    req.end();
  });
}

test("Compression: getCompressionStream Unit Verification", () => {
  // 1. Brotli when Accept-Encoding includes br
  const headersBr = {};
  const brStream = getCompressionStream({ headers: { "accept-encoding": "gzip, deflate, br" } }, headersBr, true);
  assert.ok(brStream);
  assert.equal(headersBr["Content-Encoding"], "br");
  assert.equal(headersBr["Vary"], "Accept-Encoding");

  // 2. Gzip fallback when br is not present
  const headersGzip = {};
  const gzipStream = getCompressionStream({ headers: { "accept-encoding": "gzip, deflate" } }, headersGzip, true);
  assert.ok(gzipStream);
  assert.equal(headersGzip["Content-Encoding"], "gzip");
  assert.equal(headersGzip["Vary"], "Accept-Encoding");

  // 3. Raw file when no compression header
  const headersRaw = {};
  const rawStream = getCompressionStream({ headers: {} }, headersRaw, true);
  assert.equal(rawStream, null);
  assert.equal(headersRaw["Content-Encoding"], undefined);

  // 4. Incompressible files (e.g. images / videos) return null
  const headersImg = {};
  const imgStream = getCompressionStream({ headers: { "accept-encoding": "br" } }, headersImg, false);
  assert.equal(imgStream, null);
  assert.equal(headersImg["Content-Encoding"], undefined);
});

test("Compression: HTTP Server Serving with Brotli, Gzip, and Raw", async (t) => {
  const testServer = http.createServer(server.listeners("request")[0]);

  await new Promise((resolve) => testServer.listen(0, "127.0.0.1", resolve));
  const port = testServer.address().port;

  t.after(() => {
    return new Promise((resolve) => testServer.close(resolve));
  });

  // 1. Request with Accept-Encoding: br -> Content-Encoding: br
  {
    const res = await httpRequest({
      hostname: "127.0.0.1",
      port,
      path: "/index.html",
      method: "GET",
      headers: { "Accept-Encoding": "br" }
    });
    assert.equal(res.statusCode, 200);
    assert.equal(res.headers["content-encoding"], "br");
    assert.equal(res.headers["vary"], "Accept-Encoding");
    const decompressed = zlib.brotliDecompressSync(res.rawBody).toString("utf-8");
    assert.ok(decompressed.includes("<html") || decompressed.includes("<!DOCTYPE html"));
  }

  // 2. Request with Accept-Encoding: gzip -> Content-Encoding: gzip
  {
    const res = await httpRequest({
      hostname: "127.0.0.1",
      port,
      path: "/index.html",
      method: "GET",
      headers: { "Accept-Encoding": "gzip" }
    });
    assert.equal(res.statusCode, 200);
    assert.equal(res.headers["content-encoding"], "gzip");
    assert.equal(res.headers["vary"], "Accept-Encoding");
    const decompressed = zlib.gunzipSync(res.rawBody).toString("utf-8");
    assert.ok(decompressed.includes("<html") || decompressed.includes("<!DOCTYPE html"));
  }

  // 3. Request with Accept-Encoding: gzip, deflate, br -> prioritizes br
  {
    const res = await httpRequest({
      hostname: "127.0.0.1",
      port,
      path: "/index.html",
      method: "GET",
      headers: { "Accept-Encoding": "gzip, deflate, br" }
    });
    assert.equal(res.statusCode, 200);
    assert.equal(res.headers["content-encoding"], "br");
    const decompressed = zlib.brotliDecompressSync(res.rawBody).toString("utf-8");
    assert.ok(decompressed.includes("<html") || decompressed.includes("<!DOCTYPE html"));
  }

  // 4. Request without compression header -> raw file
  {
    const res = await httpRequest({
      hostname: "127.0.0.1",
      port,
      path: "/index.html",
      method: "GET",
      headers: {}
    });
    assert.equal(res.statusCode, 200);
    assert.equal(res.headers["content-encoding"], undefined);
    const text = res.rawBody.toString("utf-8");
    assert.ok(text.includes("<html") || text.includes("<!DOCTYPE html"));
  }

  // 5. SPA index.html fallback with Accept-Encoding: br
  {
    const res = await httpRequest({
      hostname: "127.0.0.1",
      port,
      path: "/some-spa-route",
      method: "GET",
      headers: { "Accept-Encoding": "br" }
    });
    assert.equal(res.statusCode, 200);
    assert.equal(res.headers["content-encoding"], "br");
    const decompressed = zlib.brotliDecompressSync(res.rawBody).toString("utf-8");
    assert.ok(decompressed.includes("<html") || decompressed.includes("<!DOCTYPE html"));
  }

  // 6. HEAD request returns headers but empty body
  {
    const res = await httpRequest({
      hostname: "127.0.0.1",
      port,
      path: "/index.html",
      method: "HEAD",
      headers: { "Accept-Encoding": "br" }
    });
    assert.equal(res.statusCode, 200);
    assert.equal(res.headers["content-encoding"], "br");
    assert.equal(res.rawBody.length, 0);
  }
});
