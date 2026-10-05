/**
 * Tanka Resilient JSON Parser
 * Handles escaped LaTeX math (\frac, \sqrt, \Delta), trailing commas, and markdown fences
 */
function safeJsonParse(raw, fallback = null) {
  if (!raw || typeof raw !== "string") return fallback;

  let s = raw.trim();
  // Strip markdown code fences
  if (s.startsWith("```json")) s = s.slice(7);
  else if (s.startsWith("```")) s = s.slice(3);
  if (s.endsWith("```")) s = s.slice(0, -3);
  s = s.trim();

  // 1. Direct standard parse
  try {
    return JSON.parse(s);
  } catch {}

  // 2. Escape unescaped backslashes commonly emitted in LaTeX KaTeX math strings (e.g. \frac, \alpha)
  try {
    const repaired = s.replace(/\\(?!["\\/bfnrt]|u[0-9a-fA-F]{4})/g, "\\\\");
    return JSON.parse(repaired);
  } catch {}

  // 3. Remove trailing commas before closing braces/brackets
  try {
    const noTrailing = s.replace(/,\s*([\]\}])(?=(?:[^"]*"[^"]*")*[^"]*$)/g, "$1");
    const repaired = noTrailing.replace(/\\(?!["\\/bfnrt]|u[0-9a-fA-F]{4})/g, "\\\\");
    return JSON.parse(repaired);
  } catch {}

  // 4. Extract first array structure [ ... ]
  const arrayMatch = s.match(/\[\s*\{[\s\S]*\}\s*\]/);
  if (arrayMatch) {
    try {
      return JSON.parse(arrayMatch[0]);
    } catch {
      try {
        const repaired = arrayMatch[0].replace(/\\(?!["\\/bfnrt]|u[0-9a-fA-F]{4})/g, "\\\\");
        return JSON.parse(repaired);
      } catch {}
    }
  }

  // 5. Extract first object structure { ... }
  const objMatch = s.match(/\{[\s\S]*\}/);
  if (objMatch) {
    try {
      return JSON.parse(objMatch[0]);
    } catch {
      try {
        const repaired = objMatch[0].replace(/\\(?!["\\/bfnrt]|u[0-9a-fA-F]{4})/g, "\\\\");
        return JSON.parse(repaired);
      } catch {}
    }
  }

  return fallback;
}

module.exports = { safeJsonParse };
