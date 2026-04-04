import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { compileTps, TpsPlaybackSession, TpsPlayer, TpsStandalonePlayer } from "../js/lib/index.js";
import { buildExampleSnapshot, exampleSnapshotPath, EXAMPLE_FILES } from "./example-snapshot-utils.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "../..");

for (const fileName of EXAMPLE_FILES) {
  const source = readFileSync(path.join(rootDir, "examples", fileName), "utf8");
  const result = compileTps(source);
  if (!result.ok) {
    throw new Error(`Failed to compile ${fileName}: ${result.diagnostics.map(diagnostic => diagnostic.code).join(", ")}`);
  }

  const snapshot = buildExampleSnapshot(fileName, result.script, {
    playerFactory: (script) => new TpsPlayer(script),
    sessionFactory: (script) => new TpsPlaybackSession(script),
    standaloneFactory: (script) => TpsStandalonePlayer.fromCompiledScript(script)
  });
  const targetPath = exampleSnapshotPath(rootDir, fileName);
  mkdirSync(path.dirname(targetPath), { recursive: true });
  writeFileSync(targetPath, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
}

const transportSource = readFileSync(path.join(rootDir, "SDK", "fixtures", "valid", "runtime-parity.tps"), "utf8");
const transportResult = compileTps(transportSource);
if (!transportResult.ok) {
  throw new Error(`Failed to compile runtime-parity.tps: ${transportResult.diagnostics.map(diagnostic => diagnostic.code).join(", ")}`);
}

const transportPath = path.join(rootDir, "SDK", "fixtures", "transport", "runtime-parity.compiled.json");
mkdirSync(path.dirname(transportPath), { recursive: true });
writeFileSync(transportPath, `${JSON.stringify(transportResult.script, null, 2)}\n`, "utf8");
