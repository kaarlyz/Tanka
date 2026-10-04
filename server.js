const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

// Load .env
const envPath = path.join(__dirname, ".env");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf8");
  for (const line of envContent.split("\n")) {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || "";
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      process.env[key] = value;
    }
  }
}

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

const PORT = parseInt(process.env.PORT || "3001", 10);
const ROUTER_URL = process.env.ROUTER_URL || "http://127.0.0.1:20128/v1";

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
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  });
  res.end(JSON.stringify(payload));
  return true;
}

// Helper to parse JSON body
function getBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 50 * 1024 * 1024) {
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

const helpers = { sendJSON, getBody };

const server = http.createServer(async (req, res) => {
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

    // Static file fallback (production built frontend)
    const distPath = path.join(__dirname, "dist");
    let filePath = path.join(distPath, pathname === "/" ? "index.html" : pathname);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath);
      const mimeTypes = {
        ".html": "text/html",
        ".js": "application/javascript",
        ".css": "text/css",
        ".svg": "image/svg+xml",
        ".json": "application/json",
        ".woff2": "font/woff2",
        ".woff": "font/woff",
        ".ttf": "font/ttf",
      };
      res.writeHead(200, { "Content-Type": mimeTypes[ext] || "application/octet-stream" });
      return fs.createReadStream(filePath).pipe(res);
    }

    if (!pathname.startsWith("/api/")) {
      const indexHtml = path.join(distPath, "index.html");
      if (fs.existsSync(indexHtml)) {
        res.writeHead(200, { "Content-Type": "text/html" });
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

server.listen(PORT, "0.0.0.0", () => {
  console.log(`[tanka-server] Running on http://0.0.0.0:${PORT}`);
  console.log(`[tanka-server] Connected to 9Router at ${ROUTER_URL}`);
});