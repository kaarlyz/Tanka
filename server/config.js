const fs = require("node:fs");
const path = require("node:path");

// 1. Muat .env secara aman
const envPath = path.resolve(__dirname, "..", ".env");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf8");
  for (const line of envContent.split("\n")) {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || "";
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
      if (!process.env[key]) {
        process.env[key] = value.trim();
      }
    }
  }
}

// 2. Variabel Kanonikal & Alias Kompatibilitas
const ROUTER_URL = process.env.ROUTER_URL || process.env.NINE_ROUTER_URL || "http://127.0.0.1:20128/v1";
const ROUTER_KEY = process.env.ROUTER_KEY || process.env.OPENAI_API_KEY || "";
const PORT = parseInt(process.env.PORT || "3001", 10);
const TANKA_DB_PATH = process.env.TANKA_DB_PATH || path.resolve(__dirname, "..", "tanka.sqlite");

/**
 * Validasi konfigurasi startup tanpa membocorkan nilai rahasia
 */
function validateConfigOnStartup() {
  const isKeyConfigured = Boolean(ROUTER_KEY && ROUTER_KEY.length > 5);
  return {
    PORT,
    ROUTER_URL,
    ROUTER_KEY_CONFIGURED: isKeyConfigured,
    TANKA_DB_PATH
  };
}

module.exports = {
  ROUTER_URL,
  ROUTER_KEY,
  PORT,
  TANKA_DB_PATH,
  validateConfigOnStartup
};
