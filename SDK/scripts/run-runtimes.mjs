import { execSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sdkDir = path.resolve(__dirname, "..");
const repoRoot = path.resolve(sdkDir, "..");
const manifestPath = path.join(sdkDir, "manifest.json");

const commandType = process.argv[2];
if (!["build", "test", "coverage"].includes(commandType)) {
  console.error("Usage: node SDK/scripts/run-runtimes.mjs <build|test|coverage>");
  process.exit(1);
}

const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const runtimes = manifest.runtimes.filter((runtime) => runtime.enabled && typeof runtime[commandType] === "string");

if (runtimes.length === 0) {
  console.log(`No enabled runtimes expose a '${commandType}' command.`);
  process.exit(0);
}

for (const runtime of runtimes) {
  const command = runtime[commandType];
  console.log(`\n=== ${runtime.language} ${commandType} ===`);
  execSync(command, {
    cwd: repoRoot,
    stdio: "inherit",
    env: process.env
  });
}
