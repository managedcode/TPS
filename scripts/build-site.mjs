import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import hljs from "highlight.js";
import MarkdownIt from "markdown-it";
import markdownItAnchor from "markdown-it-anchor";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const readmePath = path.join(rootDir, "README.md");
const stylesPath = path.join(rootDir, "website", "site.css");
const publicDir = path.join(rootDir, "public");
const distDir = path.join(rootDir, "dist");

const readme = await readFile(readmePath, "utf8");
const styles = await readFile(stylesPath, "utf8");

const md = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: true,
  highlight(code, language) {
    if (language && hljs.getLanguage(language)) {
      return `<pre class="hljs"><code>${hljs.highlight(code, { language }).value}</code></pre>`;
    }

    return `<pre class="hljs"><code>${md.utils.escapeHtml(code)}</code></pre>`;
  }
}).use(markdownItAnchor, {
  slugify: slugifyHeading,
  permalink: markdownItAnchor.permalink.linkInsideHeader({
    symbol: "#",
    placement: "after",
    ariaHidden: true
  })
});

const tokens = md.parse(readme, {});
const title = extractTitle(tokens) ?? "TPS Format Specification";
const summary = extractSummary(tokens) ?? "Markdown-based teleprompter scripts with timing, pacing, emotion, and styling metadata.";
const sections = extractSections(tokens);
const stats = buildStats(readme, sections);
const articleHtml = md.render(readme);
const builtAt = new Intl.DateTimeFormat("en", {
  dateStyle: "long",
  timeStyle: "short",
  timeZone: "UTC"
}).format(new Date());

await rm(distDir, { recursive: true, force: true });
await mkdir(distDir, { recursive: true });
await cp(publicDir, distDir, { recursive: true });

const page = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(summary)}" />
  <meta name="theme-color" content="#0f172a" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(summary)}" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="https://tps.managed-code.com/" />
  <link rel="icon" href="./favicon.svg" type="image/svg+xml" />
  <style>${styles}</style>
</head>
<body>
  <div class="page-shell">
    <header class="hero">
      <div class="hero-copy">
        <span class="eyebrow">ManagedCode Format Spec</span>
        <h1>${escapeHtml(title)}</h1>
        <p class="hero-summary">${escapeHtml(summary)}</p>
        <div class="hero-actions">
          <a class="button button-primary" href="https://github.com/managedcode/TPS">Open Repository</a>
          <a class="button button-secondary" href="https://github.com/managedcode/TPS/blob/main/README.md">View Raw README</a>
        </div>
      </div>
      <aside class="hero-panel">
        <p class="panel-label">At a glance</p>
        <dl class="stats-grid">
          ${stats.map(({ label, value }) => `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`).join("")}
        </dl>
        <p class="panel-note">Built from <code>README.md</code> and published with GitHub Pages.</p>
      </aside>
    </header>

    <main class="layout">
      <aside class="toc-card">
        <div class="toc-header">
          <p class="panel-label">Contents</p>
          <a href="#top">Back to top</a>
        </div>
        <nav aria-label="Table of contents">
          <ol class="toc-list">
            ${renderSections(sections)}
          </ol>
        </nav>
      </aside>

      <article class="content-card">
        <div class="content-meta" id="top">
          <span>Source of truth: <code>README.md</code></span>
          <span>Last site build: ${escapeHtml(builtAt)} UTC</span>
        </div>
        <div class="markdown-body">
          ${articleHtml}
        </div>
      </article>
    </main>
  </div>
</body>
</html>`;

await writeFile(path.join(distDir, "index.html"), page, "utf8");

function slugifyHeading(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[`~!@#$%^&*()+={}\[\]|\\:;"'<>,.?/]/g, "")
    .replace(/\s+/g, "-");
}

function extractTitle(tokenList) {
  for (let index = 0; index < tokenList.length; index += 1) {
    if (tokenList[index].type === "heading_open" && tokenList[index].tag === "h1") {
      return tokenList[index + 1]?.content ?? null;
    }
  }

  return null;
}

function extractSummary(tokenList) {
  for (let index = 0; index < tokenList.length; index += 1) {
    if (tokenList[index].type !== "paragraph_open") {
      continue;
    }

    const content = tokenList[index + 1]?.content?.trim();
    if (!content) {
      continue;
    }

    return content;
  }

  return null;
}

function extractSections(tokenList) {
  const sectionList = [];

  for (let index = 0; index < tokenList.length; index += 1) {
    const token = tokenList[index];
    if (token.type !== "heading_open") {
      continue;
    }

    if (token.tag !== "h2" && token.tag !== "h3") {
      continue;
    }

    const titleToken = tokenList[index + 1];
    const content = titleToken?.content?.trim();
    if (!content) {
      continue;
    }

    sectionList.push({
      depth: Number.parseInt(token.tag.replace("h", ""), 10),
      title: content,
      slug: slugifyHeading(content)
    });
  }

  return sectionList;
}

function buildStats(markdown, sectionList) {
  const textOnly = markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]+`/g, " ")
    .replace(/\[[^\]]+\]\([^)]+\)/g, " ")
    .replace(/[#>*_\-\n\r|]/g, " ");

  const words = textOnly.match(/\b[\p{L}\p{N}'-]+\b/gu) ?? [];
  const segments = sectionList.filter((section) => section.depth === 2).length;
  const subSections = sectionList.filter((section) => section.depth === 3).length;

  return [
    { label: "Sections", value: String(segments) },
    { label: "Subsections", value: String(subSections) },
    { label: "Words", value: new Intl.NumberFormat("en").format(words.length) }
  ];
}

function renderSections(sectionList) {
  return sectionList
    .map((section) => {
      const className = section.depth === 3 ? "toc-item toc-subitem" : "toc-item";
      return `<li class="${className}"><a href="#${section.slug}">${escapeHtml(section.title)}</a></li>`;
    })
    .join("");
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
