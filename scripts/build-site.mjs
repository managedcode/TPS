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
const articleHtml = md.renderer.render(trimTitle(tokens), md.options, {});
const heroTitle = buildHeroTitle(title);
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
        <span class="eyebrow">Managed Code / Open Spec</span>
        <p class="hero-kicker">A markdown-first teleprompter format built for natural delivery.</p>
        ${heroTitle}
        <p class="hero-summary">${escapeHtml(summary)}</p>
        <ul class="hero-signals" aria-label="Format highlights">
          <li>Markdown-native authoring</li>
          <li>Actor and RSVP reading profiles</li>
          <li>Timing, pace, and emotion metadata</li>
        </ul>
        <div class="hero-actions">
          <a class="button button-primary" href="#specification">Read Specification</a>
          <a class="button button-secondary" href="https://github.com/managedcode/TPS">Open Repository</a>
        </div>
        <div class="hero-facts">
          <span><strong>${stats.sectionCount}</strong> major sections</span>
          <span><strong>${stats.subsectionCount}</strong> deep-dive subsections</span>
          <span><strong>${stats.wordCount.toLocaleString("en-US")}</strong> words of spec detail</span>
        </div>
      </div>
    </header>

    <main class="layout">
      <aside class="toc-card">
        <div class="toc-header">
          <p class="panel-label">Contents</p>
          <a href="#top">Back to top</a>
        </div>
        <p class="toc-summary">Jump straight to the part of the format you need.</p>
        <nav aria-label="Table of contents">
          <ol class="toc-list">
            ${renderSections(sections)}
          </ol>
        </nav>
      </aside>

      <article class="content-card" id="specification">
        <div class="content-meta" id="top">
          <span class="meta-chip">Source of truth <code>README.md</code></span>
          <span class="meta-chip">${stats.sectionCount} sections / ${stats.subsectionCount} subsections</span>
          <span class="meta-chip">Built ${escapeHtml(builtAt)} UTC</span>
        </div>
        <div class="markdown-body">
          ${articleHtml}
        </div>
      </article>
    </main>

    <footer class="site-footer">
      <span>Copyright &copy; Managed Code</span>
      <span>Licensed under <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a></span>
      <span><a href="https://github.com/managedcode/TPS/blob/main/LICENSE">View license</a></span>
    </footer>
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
  return {
    sectionCount: sectionList.filter((section) => section.depth === 2).length,
    subsectionCount: sectionList.filter((section) => section.depth === 3).length,
    wordCount: markdown.match(/\b[\p{L}\p{N}][\p{L}\p{N}'-]*\b/gu)?.length ?? 0
  };
}

function trimTitle(tokenList) {
  if (
    tokenList[0]?.type === "heading_open" &&
    tokenList[0]?.tag === "h1" &&
    tokenList[2]?.type === "heading_close"
  ) {
    return tokenList.slice(3);
  }

  return tokenList;
}

function buildHeroTitle(value) {
  const match = value.match(/^(.*?)\s*\((.*?)\)\s*$/);
  if (!match) {
    return `<h1>${escapeHtml(value)}</h1>`;
  }

  const baseTitle = match[1].trim();
  const subtitle = match[2].trim();
  const [lead, ...rest] = baseTitle.split(/\s+/);
  const titleTail = rest.join(" ");

  if (!lead || !titleTail) {
    return `<h1>${escapeHtml(baseTitle)}</h1><p class="hero-title-sub">${escapeHtml(subtitle)}</p>`;
  }

  return `<h1><span class="hero-title-mark">${escapeHtml(lead)}</span><span class="hero-title-main">${escapeHtml(titleTail)}</span></h1><p class="hero-title-sub">${escapeHtml(subtitle)}</p>`;
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
