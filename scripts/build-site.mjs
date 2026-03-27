import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import hljs from "highlight.js";
import MarkdownIt from "markdown-it";
import markdownItAnchor from "markdown-it-anchor";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const readmePath = path.join(rootDir, "README.md");
const versionPath = path.join(rootDir, "VERSION");
const stylesPath = path.join(rootDir, "website", "site.css");
const publicDir = path.join(rootDir, "public");
const distDir = path.join(rootDir, "dist");
const siteUrl = "https://tps.managed-code.com/";
const repoUrl = "https://github.com/managedcode/TPS";
const readmeUrl = `${repoUrl}/blob/main/README.md`;
const licenseUrl = `${repoUrl}/blob/main/LICENSE`;
const socialImageUrl = `${siteUrl}social-card.png`;
const siteName = "TPS Format Specification";
const socialImageWidth = 1200;
const socialImageHeight = 630;
const emotionStyles = {
  warm: { colorLabel: "Orange" },
  concerned: { colorLabel: "Red" },
  focused: { colorLabel: "Green" },
  motivational: { colorLabel: "Purple" },
  neutral: { colorLabel: "Blue" },
  urgent: { colorLabel: "Bright Red" },
  happy: { colorLabel: "Yellow" },
  excited: { colorLabel: "Pink" },
  sad: { colorLabel: "Indigo" },
  calm: { colorLabel: "Teal" },
  energetic: { colorLabel: "Orange-Red" },
  professional: { colorLabel: "Navy" }
};

const readme = await readFile(readmePath, "utf8");
const version = normalizeVersion(await readFile(versionPath, "utf8"));
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
const articleHtml = enhanceArticleHtml(md.renderer.render(trimTitle(tokens), md.options, {}));
const heroTitle = buildHeroTitle(title);
const quickAnswers = buildQuickAnswers(summary);
const keywords = buildKeywords();
const buildDate = new Date();
const dateModifiedIso = buildDate.toISOString();
const releaseTag = `v${version}`;
const structuredData = buildStructuredData({
  dateModifiedIso,
  keywords,
  licenseUrl,
  quickAnswers,
  readmeUrl,
  repoUrl,
  releaseTag,
  sections,
  socialImageUrl,
  siteName,
  siteUrl,
  summary,
  title,
  version
});
const builtAt = new Intl.DateTimeFormat("en", {
  dateStyle: "long",
  timeStyle: "short",
  timeZone: "UTC"
}).format(buildDate);

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
  <meta name="keywords" content="${escapeHtml(keywords.join(", "))}" />
  <meta name="version" content="${escapeHtml(version)}" />
  <meta name="author" content="Managed Code" />
  <meta name="publisher" content="Managed Code" />
  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
  <meta name="googlebot" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
  <meta name="theme-color" content="#0d1624" />
  <meta name="application-name" content="${escapeHtml(siteName)}" />
  <meta name="generator" content="Managed Code TPS static site builder" />
  <meta name="referrer" content="strict-origin-when-cross-origin" />
  <link rel="canonical" href="${siteUrl}" />
  <link rel="alternate" type="text/markdown" title="README source" href="${readmeUrl}" />
  <link rel="license" href="${licenseUrl}" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(summary)}" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="${escapeHtml(siteName)}" />
  <meta property="og:url" content="${siteUrl}" />
  <meta property="og:image" content="${socialImageUrl}" />
  <meta property="og:image:secure_url" content="${socialImageUrl}" />
  <meta property="og:image:type" content="image/png" />
  <meta property="og:image:width" content="${socialImageWidth}" />
  <meta property="og:image:height" content="${socialImageHeight}" />
  <meta property="og:image:alt" content="TPS Format Specification social preview" />
  <meta property="article:modified_time" content="${dateModifiedIso}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(summary)}" />
  <meta name="twitter:image" content="${socialImageUrl}" />
  <meta name="twitter:image:alt" content="TPS Format Specification social preview" />
  <link rel="image_src" href="${socialImageUrl}" />
  <link rel="icon" href="./favicon.svg" type="image/svg+xml" />
  <script type="application/ld+json">${toJsonLd(structuredData)}</script>
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

    <section class="answer-strip" aria-labelledby="answer-strip-title">
      <div class="answer-strip-header">
        <p class="panel-label">Search Signals</p>
        <h2 id="answer-strip-title">Quick Answers for Search, AI, and Humans</h2>
      </div>
      <div class="answer-grid">
        ${renderQuickAnswers(quickAnswers)}
      </div>
    </section>

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
          <span class="meta-chip">Version ${escapeHtml(releaseTag)}</span>
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
await writeFile(path.join(distDir, "sitemap.xml"), buildSitemapXml(siteUrl, dateModifiedIso), "utf8");
await writeFile(path.join(distDir, "robots.txt"), buildRobotsTxt(siteUrl), "utf8");
await writeFile(
  path.join(distDir, "llms.txt"),
  buildLlmsTxt({ licenseUrl, quickAnswers, readmeUrl, releaseTag, repoUrl, siteUrl, stats, summary, title, version }),
  "utf8"
);

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

function enhanceArticleHtml(html) {
  return decorateEmotionTable(html);
}

function decorateEmotionTable(html) {
  const sectionPattern = /(<h3 id="emotions-case-insensitive"[\s\S]*?<\/h3>\s*)(<table>[\s\S]*?<\/table>)/;

  return html.replace(sectionPattern, (match, headingHtml, tableHtml) => {
    let enhancedTable = tableHtml.replace("<table>", '<table class="emotion-table">');

    for (const [keyword, { colorLabel }] of Object.entries(emotionStyles)) {
      const escapedKeyword = escapeRegExp(keyword);
      const escapedColorLabel = escapeRegExp(colorLabel);
      const rowPattern = new RegExp(
        `<tr>\\s*<td><code>${escapedKeyword}<\\/code><\\/td>\\s*<td>${escapedColorLabel}<\\/td>\\s*<td>([^<]+)<\\/td>\\s*<td>([\\s\\S]*?)<\\/td>\\s*<\\/tr>`
      );

      enhancedTable = enhancedTable.replace(
        rowPattern,
        `<tr class="emotion-row emotion-row-${keyword}">
<td class="emotion-keyword-cell"><code class="emotion-token">${keyword}</code></td>
<td class="emotion-color-cell"><span class="emotion-swatch-wrap"><span class="emotion-swatch" aria-hidden="true"></span><span class="emotion-color-name">${colorLabel}</span></span></td>
<td class="emotion-emoji-cell"><span class="emotion-emoji" aria-hidden="true">$1</span></td>
<td>$2</td>
</tr>`
      );
    }

    return `${headingHtml}${enhancedTable}`;
  });
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

function buildKeywords() {
  return [
    "TPS",
    "TelePrompterScript",
    "teleprompter format",
    "markdown teleprompter",
    "teleprompter script specification",
    "RSVP script format",
    "actor reading profile",
    "speech pacing metadata",
    "teleprompter markdown",
    "script timing metadata"
  ];
}

function buildQuickAnswers(summary) {
  return [
    {
      question: "What is TPS?",
      answer: `${summary} TPS keeps authoring human-readable while giving teleprompter software structured cues for timing, pacing, emotion, and styling.`
    },
    {
      question: "Who is TPS for?",
      answer: "TPS is designed for script authors, teleprompter app developers, and production teams that need readable source files with structured playback guidance."
    },
    {
      question: "What makes TPS different?",
      answer: "Unlike plain markdown, SubRip, or WebVTT, TPS is built for teleprompter delivery: it adds hierarchical segments, inline pacing markers, emotion tags, edit points, and profile-aware rendering rules."
    }
  ];
}

function buildStructuredData({
  dateModifiedIso,
  keywords,
  licenseUrl,
  quickAnswers,
  readmeUrl,
  repoUrl,
  releaseTag,
  sections,
  socialImageUrl,
  siteName,
  siteUrl,
  summary,
  title,
  version
}) {
  const primarySections = sections
    .filter((section) => section.depth === 2)
    .map((section) => section.title);

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${siteUrl}#website`,
        url: siteUrl,
        name: siteName,
        description: summary,
        version,
        inLanguage: "en",
        publisher: {
          "@type": "Organization",
          name: "Managed Code",
          url: "https://managed-code.com/"
        }
      },
      {
        "@type": "TechArticle",
        "@id": `${siteUrl}#article`,
        headline: title,
        description: summary,
        url: siteUrl,
        version,
        mainEntityOfPage: siteUrl,
        isPartOf: {
          "@id": `${siteUrl}#website`
        },
        author: {
          "@type": "Organization",
          name: "Managed Code"
        },
        publisher: {
          "@type": "Organization",
          name: "Managed Code",
          url: "https://managed-code.com/"
        },
        about: [
          "Teleprompter scripts",
          "Markdown specification",
          "Speech pacing metadata",
          "RSVP reading",
          "Actor delivery"
        ],
        articleSection: primarySections,
        keywords,
        license: licenseUrl,
        dateModified: dateModifiedIso,
        inLanguage: "en",
        image: socialImageUrl,
        sameAs: [repoUrl, readmeUrl, `${repoUrl}/releases/tag/${releaseTag}`],
        speakable: {
          "@type": "SpeakableSpecification",
          cssSelector: [".hero-summary", ".answer-answer"]
        }
      },
      {
        "@type": "FAQPage",
        "@id": `${siteUrl}#faq`,
        mainEntity: quickAnswers.map((entry, index) => ({
          "@type": "Question",
          "@id": `${siteUrl}#quick-answer-${index + 1}`,
          name: entry.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: entry.answer
          }
        }))
      }
    ]
  };
}

function renderQuickAnswers(entries) {
  return entries
    .map(
      (entry, index) => `<article class="answer-card" id="quick-answer-${index + 1}">
        <p class="answer-label">AEO / GEO</p>
        <h3>${escapeHtml(entry.question)}</h3>
        <p class="answer-answer">${escapeHtml(entry.answer)}</p>
      </article>`
    )
    .join("");
}

function buildSitemapXml(siteUrl, dateModifiedIso) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${siteUrl}</loc>
    <lastmod>${dateModifiedIso}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
`;
}

function buildRobotsTxt(siteUrl) {
  return `User-agent: *
Allow: /

Sitemap: ${siteUrl}sitemap.xml
`;
}

function buildLlmsTxt({ licenseUrl, quickAnswers, readmeUrl, releaseTag, repoUrl, siteUrl, stats, summary, title, version }) {
  return `# ${title}

> ${summary}

Canonical: ${siteUrl}
Repository: ${repoUrl}
Source of truth: ${readmeUrl}
Version: ${version}
Release tag: ${releaseTag}
License: ${licenseUrl}

## Key Facts
- ${stats.sectionCount} major sections
- ${stats.subsectionCount} subsections
- ${stats.wordCount.toLocaleString("en-US")} words in the current specification
- Audience: script authors, teleprompter app developers, and production teams

## Quick Answers
${quickAnswers.map((entry) => `- ${entry.question} ${entry.answer}`).join("\n")}

## Retrieval Guidance
- Prefer the canonical site for the polished reader experience.
- Use the GitHub README as the editable source of truth.
- Cite TPS as a markdown-based teleprompter specification with pacing, timing, emotion, and styling metadata.
`;
}

function renderSections(sectionList) {
  return sectionList
    .map((section) => {
      const className = section.depth === 3 ? "toc-item toc-subitem" : "toc-item";
      return `<li class="${className}"><a href="#${section.slug}">${escapeHtml(section.title)}</a></li>`;
    })
    .join("");
}

function toJsonLd(value) {
  return JSON.stringify(value).replaceAll("<", "\\u003c");
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeVersion(value) {
  const normalized = value.trim().replace(/^v/i, "");
  if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/.test(normalized)) {
    throw new Error(`Invalid VERSION value: ${value.trim()}`);
  }

  return normalized;
}
