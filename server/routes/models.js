const { ROUTER_URL, ROUTER_KEY } = require("../ai");

async function handleModelsRoutes(req, res, pathname, helpers) {
  const { sendJSON } = helpers;

  // GET /api/models - list 9router models
  if (req.method === "GET" && pathname === "/api/models") {
    try {
      const resp = await fetch(`${ROUTER_URL}/models`, {
        headers: { Authorization: `Bearer ${ROUTER_KEY}` },
      });
      const data = await resp.json();
      const raw = Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []);
      const models = raw.map(m => typeof m === "string" ? m : (m && m.id ? m.id : "")).filter(Boolean);
      return sendJSON(res, { models: models.length > 0 ? models : ["ag/gemini-3.8-flash-low", "ag/gemini-3.8-flash-mid", "ag/gemini-3.8-flash-high"] });
    } catch (err) {
      console.warn("9Router /models error, fallback to default list:", err.message);
      return sendJSON(res, {
        models: [
          "ag/gemini-3.8-flash-low",
          "ag/gemini-3.8-flash-mid",
          "ag/gemini-3.8-flash-high"
        ]
      });
    }
  }

  return false;
}

module.exports = {
  handleModelsRoutes
};
