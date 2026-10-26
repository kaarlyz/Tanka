/**
 * Tanka Resilient JSON Parser
 * Handles escaped LaTeX math (\frac, \sqrt, \Delta), trailing commas, and markdown fences
 */

function preprocessLatexJson(raw) {
  if (!raw || typeof raw !== "string") return raw;
  return raw
    .replace(/\u000c/g, "\\\\f")
    .replace(/\u0008/g, "\\\\b")
    .replace(/\t(imes|ext|heta|an|au)\b/g, "\\\\t$1")
    .replace(/\r(ight|ho|angle)\b/g, "\\\\r$1")
    .replace(/\n(eq|abla|ot|u)\b/g, "\\\\n$1")
    .replace(/(?<!\\)\\(frac|forall|flat|begin|beta|bar|binom|boxed|bold|bullet|bf|times|text|theta|tan|tau|right|rho|rangle|neq|nabla|not|nu)\b/g, "\\\\$1");
}

function healControlCharsToLatex(val) {
  if (typeof val === "string") {
    return val
      .replace(/\u000c/g, "\\f")
      .replace(/\u0008/g, "\\b")
      .replace(/\t(imes|ext|heta|an|au)\b/g, "\\t$1")
      .replace(/\r(ight|ho|angle)\b/g, "\\r$1")
      .replace(/\n(eq|abla|ot|u)\b/g, "\\n$1");
  }
  if (Array.isArray(val)) {
    return val.map(healControlCharsToLatex);
  }
  if (val !== null && typeof val === "object") {
    const res = {};
    for (const [k, v] of Object.entries(val)) {
      res[k] = healControlCharsToLatex(v);
    }
    return res;
  }
  return val;
}

function repairTruncatedJsonArray(raw) {
  if (!raw || typeof raw !== "string") return null;
  const pre = preprocessLatexJson(raw);
  const start = pre.indexOf("[");
  if (start === -1) return null;

  let pos = pre.lastIndexOf("}");
  while (pos > start) {
    let candidate = pre.slice(start, pos + 1).trim();
    candidate = candidate.replace(/,\s*$/, "") + "\n]";
    try {
      const parsed = JSON.parse(candidate);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return candidate;
      }
    } catch {
      try {
        const repaired = candidate.replace(/\\(?!["\\/bfnrt]|u[0-9a-fA-F]{4})/g, "\\\\");
        const parsed = JSON.parse(repaired);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return repaired;
        }
      } catch {}
    }
    pos = pre.lastIndexOf("}", pos - 1);
  }
  return null;
}

function repairTruncatedJsonObjectWithArray(raw) {
  if (!raw || typeof raw !== "string") return null;
  const pre = preprocessLatexJson(raw);
  const start = pre.indexOf("{");
  if (start === -1) return null;

  let pos = pre.lastIndexOf("}");
  while (pos > start) {
    let candidate = pre.slice(start, pos + 1).trim();
    candidate = candidate.replace(/,\s*$/, "") + "\n  ]\n}";
    try {
      const parsed = JSON.parse(candidate);
      if (parsed && (Array.isArray(parsed.items) || Array.isArray(parsed.soal) || Array.isArray(parsed.questions))) {
        return candidate;
      }
    } catch {
      try {
        const repaired = candidate.replace(/\\(?!["\\/bfnrt]|u[0-9a-fA-F]{4})/g, "\\\\");
        const parsed = JSON.parse(repaired);
        if (parsed && (Array.isArray(parsed.items) || Array.isArray(parsed.soal) || Array.isArray(parsed.questions))) {
          return repaired;
        }
      } catch {}
    }
    pos = pre.lastIndexOf("}", pos - 1);
  }
  return null;
}

function safeJsonParse(raw, fallback = null) {
  if (!raw || typeof raw !== "string") return fallback;

  let s = raw.trim();
  // Strip markdown code fences
  if (s.startsWith("```json")) s = s.slice(7);
  else if (s.startsWith("```")) s = s.slice(3);
  if (s.endsWith("```")) s = s.slice(0, -3);
  s = s.trim();

  // 0. Preprocess LaTeX JSON to prevent control character corruption
  s = preprocessLatexJson(s);

  // 0b. Clean hallucinated noise strings after empty quotes (e.g. "" Jaeger" -> "")
  s = s.replace(/""\s*[A-Za-z0-9_-]+"/g, '""');
  s = s.replace(/""\s*[A-Za-z0-9_-]+\s*([,\}])/g, '""$1');

  // 1. Direct standard parse
  try {
    return healControlCharsToLatex(JSON.parse(s));
  } catch {}

  // 2. Escape unescaped backslashes commonly emitted in LaTeX KaTeX math strings (e.g. \frac, \alpha)
  try {
    const repaired = s.replace(/\\(?!["\\/bfnrt]|u[0-9a-fA-F]{4})/g, "\\\\");
    return healControlCharsToLatex(JSON.parse(repaired));
  } catch {}

  // 3. Remove trailing commas before closing braces/brackets
  try {
    const noTrailing = s.replace(/,\s*([\]\}])(?=(?:[^"]*"[^"]*")*[^"]*$)/g, "$1");
    const repaired = noTrailing.replace(/\\(?!["\\/bfnrt]|u[0-9a-fA-F]{4})/g, "\\\\");
    return healControlCharsToLatex(JSON.parse(repaired));
  } catch {}

  // 4. Extract first array structure [ ... ]
  const arrayMatch = s.match(/\[\s*\{[\s\S]*\}\s*\]/);
  if (arrayMatch) {
    try {
      return healControlCharsToLatex(JSON.parse(arrayMatch[0]));
    } catch {
      try {
        const repaired = arrayMatch[0].replace(/\\(?!["\\/bfnrt]|u[0-9a-fA-F]{4})/g, "\\\\");
        return healControlCharsToLatex(JSON.parse(repaired));
      } catch {}
    }
  }

  // 5. Truncated array repair
  const repairedArrayCandidate = repairTruncatedJsonArray(s);
  if (repairedArrayCandidate) {
    try {
      return healControlCharsToLatex(JSON.parse(repairedArrayCandidate));
    } catch {}
  }

  // 5b. Truncated object with array repair
  const repairedObjectCandidate = repairTruncatedJsonObjectWithArray(s);
  if (repairedObjectCandidate) {
    try {
      return healControlCharsToLatex(JSON.parse(repairedObjectCandidate));
    } catch {}
  }

  // 6. Extract first object structure { ... }
  const objMatch = s.match(/\{[\s\S]*\}/);
  if (objMatch) {
    try {
      return healControlCharsToLatex(JSON.parse(objMatch[0]));
    } catch {
      try {
        const repaired = objMatch[0].replace(/\\(?!["\\/bfnrt]|u[0-9a-fA-F]{4})/g, "\\\\");
        return healControlCharsToLatex(JSON.parse(repaired));
      } catch {}
    }
  }

  return fallback;
}

module.exports = {
  safeJsonParse,
  preprocessLatexJson,
  healControlCharsToLatex,
  repairTruncatedJsonArray,
  repairTruncatedJsonObjectWithArray
};
