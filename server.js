const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const zlib = require("node:zlib");
const { PORT, ROUTER_URL, validateConfigOnStartup } = require("./server/config");

const { handleModelsRoutes } = require("./server/routes/models");
const { handleDocumentsRoutes } = require("./server/routes/documents");
const { handleQuizzesRoutes } = require("./server/routes/quizzes");
const { handleFlashcardsRoutes } = require("./server/routes/flashcards");
const { handleSummaryRoutes } = require("./server/routes/summary");
const { handleFeynmanRoutes } = require("./server/routes/feynman");
const { handleMistakesRoutes } = require("./server/routes/mistakes");
const { handleCheatsheetRoutes } = require("./server/routes/cheatsheet");
const { handleChatRoutes } = require("./server/routes/chat");
const { handleTopicsRoutes } = require("./server/routes/topics");
const { handleExamResultsRoutes } = require("./server/routes/examResults");
const { handleAuthRoutes, getSessionUser } = require("./server/routes/auth");
const { handleUsersRoutes } = require("./server/routes/users");
const { handleRoomsRoutes } = require("./server/routes/rooms");

// Helper for JSON response
function sendJSON(res, data, statusCode = 200) {
  if (res.headersSent) return;
  const isSuccess = statusCode >= 200 && statusCode < 300;
  let payload = data;
  if (typeof data === "object" && data !== null && !Array.isArray(data)) {
    payload = {
      ok: data.ok !== undefined ? data.ok : (data.success !== undefined ? data.success : isSuccess),
      success: data.success !== undefined ? data.success : (data.ok !== undefined ? data.ok : isSuccess),
      ...data,
    };
  }
  res.writeHead(statusCode, {
    "Content-Type": "application/json",
    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
    "Pragma": "no-cache",
    "Expires": "0",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-User-Id, X-Session-Id",
  });
  res.end(JSON.stringify(payload));
  return true;
}

function getCompressionStream(req, headers, isCompressible) {
  if (!isCompressible) return null;
  const acceptEncoding = (req.headers && req.headers["accept-encoding"]) || "";
  if (acceptEncoding.includes("br") && typeof zlib.createBrotliCompress === "function") {
    headers["Content-Encoding"] = "br";
    headers["Vary"] = "Accept-Encoding";
    return zlib.createBrotliCompress();
  }
  if (acceptEncoding.includes("gzip")) {
    headers["Content-Encoding"] = "gzip";
    headers["Vary"] = "Accept-Encoding";
    return zlib.createGzip();
  }
  return null;
}

// Helper to extract userId or client session id from header/body/query
function getUserId(req, body = {}) {
  const fromHeader = req.headers["x-user-id"] || req.headers["x-session-id"];
  if (fromHeader && typeof fromHeader === "string") return fromHeader.trim();
  
  const fromBody = body.userId || body.user_id;
  if (fromBody && typeof fromBody === "string") return fromBody.trim();

  try {
    const urlObj = new URL(req.url, "http://localhost");
    const fromQuery = urlObj.searchParams.get("userId") || urlObj.searchParams.get("user_id") || urlObj.searchParams.get("sessionId");
    if (fromQuery) return fromQuery.trim();
  } catch {}

  return "anon";
}

// Helper to parse JSON body
function getBody(req, res) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 100 * 1024 * 1024) {
        if (res && !res.headersSent) {
          res.writeHead(413, {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          });
          res.end(JSON.stringify({ error: "Ukuran berkas melebihi batas 100MB" }));
        }
        req.destroy();
        reject(new Error("Request entity too large"));
      }
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on("error", reject);
  });
}

const server = http.createServer(async (req, res) => {
  const helpers = {
    sendJSON,
    getBody: (r) => getBody(r || req, res),
    getUserId,
    getSessionUser: (r) => getSessionUser(r || req)
  };
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    });
    return res.end();
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  const pathname = parsedUrl.pathname;

  try {
    // Dispatch to modular route handlers
    if (await handleModelsRoutes(req, res, pathname, helpers)) return;
    if (await handleDocumentsRoutes(req, res, pathname, helpers)) return;
    if (await handleQuizzesRoutes(req, res, pathname, helpers)) return;
    if (await handleFlashcardsRoutes(req, res, pathname, helpers)) return;
    if (await handleSummaryRoutes(req, res, pathname, helpers)) return;
    if (await handleFeynmanRoutes(req, res, pathname, helpers)) return;
    if (await handleMistakesRoutes(req, res, pathname, helpers)) return;
    if (await handleCheatsheetRoutes(req, res, pathname, helpers)) return;
    if (await handleChatRoutes(req, res, pathname, helpers)) return;
    if (await handleTopicsRoutes(req, res, pathname, helpers)) return;
    if (await handleExamResultsRoutes(req, res, pathname, helpers)) return;
    if (await handleAuthRoutes(req, res, pathname, helpers)) return;
    if (await handleUsersRoutes(req, res, pathname, helpers)) return;
    if (await handleRoomsRoutes(req, res, pathname, helpers)) return;

    // Static file fallback (production built frontend or uploaded assets)
    const distPath = path.join(__dirname, "dist");
    let filePath = pathname.startsWith("/uploads/")
      ? path.join(__dirname, pathname)
      : path.join(distPath, pathname === "/" ? "index.html" : pathname);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath);
      const mimeTypes = {
        ".html": "text/html",
        ".js": "application/javascript",
        ".css": "text/css",
        ".svg": "image/svg+xml",
        ".json": "application/json",
        ".webmanifest": "application/manifest+json",
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".webp": "image/webp",
        ".ico": "image/x-icon",
        ".woff2": "font/woff2",
        ".woff": "font/woff",
        ".ttf": "font/ttf",
        ".mp4": "video/mp4",
        ".mp3": "audio/mpeg",
      };
      const isHtml = ext === ".html";
      const isHashedAsset = pathname.startsWith("/assets/") && (ext === ".js" || ext === ".css");
      const headers = {
        "Content-Type": mimeTypes[ext] || "application/octet-stream",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": isHashedAsset
          ? "public, max-age=31536000, immutable"
          : "no-store, no-cache, must-revalidate, proxy-revalidate"
      };
      if (isHtml) {
        headers["Pragma"] = "no-cache";
        headers["Expires"] = "0";
      }
      const stat = fs.statSync(filePath);
      const fileSize = stat.size;
      const range = req.headers.range;

      if (range && (ext === ".mp4" || ext === ".mp3")) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunksize = (end - start) + 1;
        const fileStream = fs.createReadStream(filePath, { start, end });
        res.writeHead(206, {
          "Content-Range": `bytes ${start}-${end}/${fileSize}`,
          "Accept-Ranges": "bytes",
          "Content-Length": chunksize,
          "Content-Type": mimeTypes[ext] || "application/octet-stream",
          "Access-Control-Allow-Origin": "*",
        });
        return fileStream.pipe(res);
      }

      headers["Accept-Ranges"] = "bytes";

      const isCompressible = [".js", ".css", ".html", ".json", ".svg"].includes(ext);
      const compression = getCompressionStream(req, headers, isCompressible);

      if (compression) {
        if (req.method === "HEAD") {
          res.writeHead(200, headers);
          return res.end();
        }
        res.writeHead(200, headers);
        return fs.createReadStream(filePath).pipe(compression).pipe(res);
      }

      headers["Content-Length"] = fileSize;
      if (req.method === "HEAD") {
        res.writeHead(200, headers);
        return res.end();
      }
      res.writeHead(200, headers);
      return fs.createReadStream(filePath).pipe(res);
    }

    if (!pathname.startsWith("/api/")) {
      const indexHtml = path.join(distPath, "index.html");
      if (fs.existsSync(indexHtml)) {
        const headers = {
          "Content-Type": "text/html",
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          "Pragma": "no-cache",
          "Expires": "0",
          "Access-Control-Allow-Origin": "*",
        };
        const compression = getCompressionStream(req, headers, true);
        if (compression) {
          if (req.method === "HEAD") {
            res.writeHead(200, headers);
            return res.end();
          }
          res.writeHead(200, headers);
          return fs.createReadStream(indexHtml).pipe(compression).pipe(res);
        }
        if (req.method === "HEAD") {
          res.writeHead(200, headers);
          return res.end();
        }
        res.writeHead(200, headers);
        return fs.createReadStream(indexHtml).pipe(res);
      }
    }

    sendJSON(res, { error: "Route not found" }, 404);
  } catch (err) {
    console.error("[tanka-server] Error handling request:", err);
    sendJSON(res, { error: err.message }, 500);
  }
});

process.on("uncaughtException", (err) => {
  console.error("[tanka-server] Uncaught Exception:", err);
});

process.on("unhandledRejection", (reason) => {
  console.error("[tanka-server] Unhandled Rejection:", reason);
});

server.timeout = 300000;
server.keepAliveTimeout = 65000;
server.headersTimeout = 66000;

if (require.main === module) {
  server.listen(PORT, "0.0.0.0", () => {
    const cfg = validateConfigOnStartup();
    console.log(`[tanka-server] Running on http://0.0.0.0:${cfg.PORT}`);
    console.log(`[tanka-server] Connected to 9Router at ${cfg.ROUTER_URL} (key configured: ${cfg.ROUTER_KEY_CONFIGURED})`);
  });
}

module.exports = { server, getCompressionStream };