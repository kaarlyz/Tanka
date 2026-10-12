const fs = require("node:fs");
const path = require("node:path");
const { execFileSync, execFile } = require("node:child_process");

/**
 * Resolves the appropriate Python interpreter binary for Tanka.
 * Checks environment override, local virtual environments, and system python.
 *
 * @returns {string} Absolute path or command for python binary
 */
function getPythonBin() {
  if (process.env.PYTHON_BIN && fs.existsSync(process.env.PYTHON_BIN)) {
    return process.env.PYTHON_BIN;
  }

  // Cek .venv di root proyek tanka
  const projectVenv = path.resolve(__dirname, "..", "..", ".venv", "bin", "python");
  if (fs.existsSync(projectVenv)) {
    return projectVenv;
  }

  // Cek venv alternatif
  const altVenv = path.resolve(__dirname, "..", "..", "venv", "bin", "python");
  if (fs.existsSync(altVenv)) {
    return altVenv;
  }

  return "python3";
}

/**
 * Safely executes a Python script with structured timeout, error handling,
 * and buffer protections without shell interpolation.
 *
 * @param {string} scriptPath - Absolute path to script
 * @param {Array<string>} args - Script arguments
 * @param {Object} options - { timeout: number, maxBuffer: number, env: Object }
 * @returns {{ success: boolean, stdout: string, error?: string, exitCode?: number }}
 */
function executePythonScript(scriptPath, args = [], options = {}) {
  const resolvedScript = path.resolve(scriptPath);
  if (!fs.existsSync(resolvedScript)) {
    return {
      success: false,
      stdout: "",
      error: `Skrip Python tidak ditemukan pada path: ${resolvedScript}`,
      exitCode: -1
    };
  }

  const pythonBin = getPythonBin();
  const timeoutMs = options.timeout || 30000;
  const maxBuffer = options.maxBuffer || 25 * 1024 * 1024;

  try {
    const stdout = execFileSync(pythonBin, [resolvedScript, ...args], {
      encoding: "utf8",
      maxBuffer,
      timeout: timeoutMs,
      env: {
        ...process.env,
        ...(options.env || {})
      }
    });

    return {
      success: true,
      stdout: (stdout || "").trim()
    };
  } catch (err) {
    const errMsg = err.stderr ? err.stderr.toString().trim() : err.message;
    return {
      success: false,
      stdout: err.stdout ? err.stdout.toString().trim() : "",
      error: errMsg || "Eksekusi skrip Python gagal",
      exitCode: err.status || -1
    };
  }
}

/**
 * Asynchronously executes a Python script with structured timeout, error handling,
 * and buffer protections, freeing the Node.js event loop during heavy OCR / extraction.
 *
 * @param {string} scriptPath - Absolute path to script
 * @param {Array<string>} args - Script arguments
 * @param {Object} options - { timeout: number, maxBuffer: number, env: Object }
 * @returns {Promise<{ success: boolean, stdout: string, error?: string, exitCode?: number }>}
 */
function executePythonScriptAsync(scriptPath, args = [], options = {}) {
  return new Promise((resolve) => {
    const resolvedScript = path.resolve(scriptPath);
    if (!fs.existsSync(resolvedScript)) {
      return resolve({
        success: false,
        stdout: "",
        error: `Skrip Python tidak ditemukan pada path: ${resolvedScript}`,
        exitCode: -1
      });
    }

    const pythonBin = getPythonBin();
    const timeoutMs = options.timeout || 30000;
    const maxBuffer = options.maxBuffer || 25 * 1024 * 1024;

    execFile(
      pythonBin,
      [resolvedScript, ...args],
      {
        encoding: "utf8",
        maxBuffer,
        timeout: timeoutMs,
        env: {
          ...process.env,
          ...(options.env || {})
        }
      },
      (err, stdout, stderr) => {
        if (err) {
          const errMsg = stderr ? stderr.toString().trim() : err.message;
          return resolve({
            success: false,
            stdout: stdout ? stdout.toString().trim() : "",
            error: errMsg || "Eksekusi skrip Python gagal",
            exitCode: err.code || err.status || -1
          });
        }
        return resolve({
          success: true,
          stdout: (stdout || "").trim()
        });
      }
    );
  });
}

module.exports = {
  getPythonBin,
  executePythonScript,
  executePythonScriptAsync
};
