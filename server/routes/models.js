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
      return sendJSON(res, { models: data.data || [] });
    } catch (err) {
      console.warn("9Router /models error, fallback to default list:", err.message);
      return sendJSON(res, {
        models: [
          { id: "ag/gemini-3.8-flash-low" },
          { id: "ag/gemini-3.8-flash-mid" },
          { id: "ag/gemini-3.8-flash-high" }
        ]
      });
    }
  }

  return false;
}

module.exports = {
  handleModelsRoutes
};
