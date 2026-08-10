#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import process from "node:process";

const usage = `Usage: node scripts/verify_lossless.js <source.txt> <output.tps>

Verifies that a TPS document created with the tps skill recovers the supplied
source after generated TPS syntax is removed. CRLF and CR line endings are
normalized to LF; every other character must match.`;

const args = process.argv.slice(2);
if (args.includes("--help") || args.includes("-h")) {
  console.log(usage);
  process.exit(0);
}

if (args.length !== 2) {
  console.error(usage);
  process.exit(2);
}

const [sourcePath, tpsPath] = args;
const [sourceRaw, tpsRaw] = await Promise.all([
  readFile(sourcePath, "utf8"),
  readFile(tpsPath, "utf8"),
]);

const normalizeLines = (value) => value.replace(/\r\n?/g, "\n");

function stripFrontMatter(value) {
  if (!value.startsWith("---\n")) return value;
  const end = value.indexOf("\n---\n", 4);
  if (end < 0) throw new Error("TPS front matter is not closed.");
  return value.slice(end + 5);
}

function stripGeneratedHeaders(value) {
  return value.replace(/^#{2,3} \[[^\n]*\]\n/gm, "");
}

function stripStandaloneCues(value) {
  return value
    .replace(/\[pause:(?:\d+(?:\.\d+)?s|\d+ms)\]/gi, "")
    .replace(/\[breath\]/gi, "")
    .replace(/\[edit_point(?::(?:medium|high))?\]/gi, "");
}

function stripWrapperTags(value) {
  const simple = [
    "emphasis", "highlight", "xslow", "slow", "normal", "fast", "xfast",
    "loud", "soft", "whisper", "sarcasm", "aside", "rhetorical", "building",
    "legato", "staccato", "neutral", "warm", "professional", "focused",
    "concerned", "urgent", "motivational", "excited", "happy", "sad", "calm",
    "energetic", "energy", "melody", "phonetic", "pronunciation", "stress",
  ].join("|");

  const open = new RegExp(`\\[(?:${simple})(?::[^\\]\\n]+)?\\]`, "gi");
  const close = new RegExp(`\\[\\/(?:${simple})\\]`, "gi");
  const absoluteWpmOpen = /\[\d{2,3}WPM\]/gi;
  const absoluteWpmClose = /\[\/\d{2,3}WPM\]/gi;

  return value
    .replace(open, "")
    .replace(close, "")
    .replace(absoluteWpmOpen, "")
    .replace(absoluteWpmClose, "");
}

function decodeEscapes(value) {
  return value.replace(/\\([\[\]|\/*\\])/g, "$1");
}

function recoverSource(tps) {
  let value = normalizeLines(tps).replace(/^\uFEFF/, "");
  value = stripFrontMatter(value);
  value = stripGeneratedHeaders(value);
  value = stripStandaloneCues(value);
  value = stripWrapperTags(value);
  return decodeEscapes(value);
}

function position(value, index) {
  const before = value.slice(0, index);
  const lines = before.split("\n");
  return { line: lines.length, column: lines.at(-1).length + 1 };
}

function firstDifference(left, right) {
  const limit = Math.min(left.length, right.length);
  for (let index = 0; index < limit; index += 1) {
    if (left[index] !== right[index]) return index;
  }
  return left.length === right.length ? -1 : limit;
}

const source = normalizeLines(sourceRaw).replace(/^\uFEFF/, "");
let recovered;

try {
  recovered = recoverSource(tpsRaw);
} catch (error) {
  console.error(JSON.stringify({ ok: false, error: error.message }, null, 2));
  process.exit(1);
}

const difference = firstDifference(source, recovered);
if (difference >= 0) {
  const at = position(source, difference);
  const contextStart = Math.max(0, difference - 30);
  const contextEnd = difference + 30;
  console.error(JSON.stringify({
    ok: false,
    error: "Recovered TPS text differs from source.",
    line: at.line,
    column: at.column,
    sourceLength: source.length,
    recoveredLength: recovered.length,
    sourceContext: source.slice(contextStart, contextEnd),
    recoveredContext: recovered.slice(contextStart, contextEnd),
  }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({
  ok: true,
  sourceLength: source.length,
  recoveredLength: recovered.length,
}, null, 2));
