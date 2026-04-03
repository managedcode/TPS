import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const manifestPath = path.join(rootDir, "manifest.json");
const compact = process.argv.includes("--compact");
const coverageOnly = process.argv.includes("--coverage");

const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const enabledRuntimes = manifest.runtimes.filter((runtime) => runtime.enabled);
const selectedRuntimes = coverageOnly
  ? enabledRuntimes.filter((runtime) => typeof runtime.coverage === "string" && runtime.coverage.length > 0)
  : enabledRuntimes;
const output = compact ? JSON.stringify(selectedRuntimes) : JSON.stringify(selectedRuntimes, null, 2);

process.stdout.write(output);
