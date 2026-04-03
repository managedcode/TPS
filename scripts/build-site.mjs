import { cp, mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
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
const examplesDir = path.join(rootDir, "examples");
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

const tpsExamples = await loadExamples(examplesDir);

await rm(distDir, { recursive: true, force: true });
await mkdir(distDir, { recursive: true });
await mkdir(path.join(distDir, "examples"), { recursive: true });
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
  <meta name="theme-color" content="#faf8f4" />
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
  <div class="scroll-progress" aria-hidden="true"></div>

  <nav class="top-nav" aria-label="Site navigation">
    <div class="nav-inner">
      <a class="nav-logo" href="#">
        <svg width="24" height="24" viewBox="0 0 28 28" fill="none" aria-hidden="true">
          <rect width="28" height="28" rx="8" fill="url(#nav-grad)"/>
          <path d="M7 9h14M7 14h10M7 19h12" stroke="#faf8f4" stroke-width="2.2" stroke-linecap="round"/>
          <defs><linearGradient id="nav-grad" x1="0" y1="0" x2="28" y2="28"><stop stop-color="#b8963e"/><stop offset="1" stop-color="#d4a847"/></linearGradient></defs>
        </svg>
        <span>TPS</span>
      </a>
      <div class="nav-links">
        <a href="#specification">Spec</a>
        <a href="#complete-example">Example</a>
        <a href="https://prompter.one" target="_blank" rel="noopener">Prompter One</a>
        <a class="nav-gh" href="https://github.com/managedcode/TPS" target="_blank" rel="noopener">
          <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>
          GitHub
        </a>
      </div>
    </div>
  </nav>

  <div class="page-shell">
    <header class="hero">
      <div class="hero-copy">
        <div class="hero-glow" aria-hidden="true"></div>
        <span class="eyebrow">Managed Code / Open Spec</span>
        <p class="hero-kicker">A markdown-first teleprompter format built for natural delivery.</p>
        ${heroTitle}
        <p class="hero-summary">${escapeHtml(summary)}</p>
        <ul class="hero-signals" aria-label="Format highlights">
          <li><svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M2 3h12M2 7h8M2 11h10" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>Markdown-native authoring</li>
          <li><svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><circle cx="8" cy="6" r="3" stroke="currentColor" stroke-width="1.6"/><path d="M3 14c0-2.76 2.24-5 5-5s5 2.24 5 5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>Actor reading profile</li>
          <li><svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.6"/><path d="M8 4v4l3 2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>Timing, pace, and emotion metadata</li>
        </ul>
        <div class="hero-actions">
          <a class="button button-primary" href="#specification">Read Specification</a>
          <a class="button button-secondary" href="https://prompter.one" target="_blank" rel="noopener">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3 2l10 6-10 6V2z" fill="currentColor"/></svg>
            Try Prompter One
          </a>
          <a class="button button-secondary" href="https://github.com/managedcode/TPS" target="_blank" rel="noopener">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>
            GitHub
          </a>
        </div>
        <p class="hero-prompterone">
          <a href="https://prompter.one" target="_blank" rel="noopener">Prompter One</a> is an open-source editor &amp; teleprompter that implements the TPS format.
          <a href="https://github.com/managedcode/PrompterOne" target="_blank" rel="noopener">View source on GitHub</a>
        </p>
        <div class="ai-buttons hero-ai-buttons">
          ${renderAiButtons()}
        </div>
        <div class="hero-facts">
          <span><strong>${stats.sectionCount}</strong> major sections</span>
          <span><strong>${stats.subsectionCount}</strong> deep-dive subsections</span>
          <span><strong>${stats.wordCount.toLocaleString("en-US")}</strong> words of spec detail</span>
        </div>
      </div>
    </header>

    <section class="answer-strip reveal" aria-labelledby="answer-strip-title">
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

    <section class="examples-strip reveal" aria-labelledby="examples-title">
      <div class="answer-strip-header">
        <p class="panel-label">Live Examples</p>
        <h2 id="examples-title">See TPS in Action</h2>
      </div>
      <div class="examples-grid">
        ${renderExampleCards(tpsExamples)}
      </div>
    </section>

    <section class="ai-strip reveal" aria-labelledby="ai-strip-title">
      <div class="answer-strip-header">
        <p class="panel-label">AI Assistants</p>
        <h2 id="ai-strip-title">Explore TPS with AI</h2>
      </div>
      <p class="ai-strip-desc">Ask an AI assistant about the TPS format, syntax, parsing rules, or how to write teleprompter scripts.</p>
      <div class="ai-buttons">
        ${renderAiButtons()}
      </div>
    </section>

    <footer class="site-footer">
      <span>Copyright &copy; <a href="https://www.managed-code.com/" target="_blank" rel="noopener">Managed Code</a></span>
      <span>Licensed under <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a></span>
      <span><a href="https://github.com/managedcode/TPS/blob/main/LICENSE">View license</a></span>
    </footer>
  </div>

  <button class="back-to-top" aria-label="Back to top" onclick="window.scrollTo({top:0,behavior:'smooth'})">
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 16V4m0 0l-5 5m5-5l5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
  </button>

  <script>
  (function(){
    var progress = document.querySelector('.scroll-progress');
    var backBtn = document.querySelector('.back-to-top');
    var nav = document.querySelector('.top-nav');
    var lastScroll = 0;

    function onScroll() {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      var pct = h > 0 ? (window.scrollY / h) * 100 : 0;
      progress.style.width = pct + '%';

      if (window.scrollY > 600) {
        backBtn.classList.add('visible');
      } else {
        backBtn.classList.remove('visible');
      }

      if (window.scrollY > 80) {
        nav.classList.add('scrolled');
      } else {
        nav.classList.remove('scrolled');
      }

      lastScroll = window.scrollY;
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    var reveals = document.querySelectorAll('.reveal');
    if ('IntersectionObserver' in window && reveals.length) {
      var io = new IntersectionObserver(function(entries) {
        entries.forEach(function(e) {
          if (e.isIntersecting) {
            e.target.classList.add('revealed');
            io.unobserve(e.target);
          }
        });
      }, { threshold: 0.12 });
      reveals.forEach(function(el) { io.observe(el); });
    }
  })();
  </script>
</body>
</html>`;

await writeFile(path.join(distDir, "index.html"), page, "utf8");

for (const ex of tpsExamples) {
  const exPage = buildExamplePage(ex, styles);
  await writeFile(path.join(distDir, "examples", `${ex.slug}.html`), exPage, "utf8");
}

await writeFile(path.join(distDir, "examples", "index.html"), buildExamplesIndexPage(tpsExamples, styles), "utf8");

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
  const icons = [
    '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><circle cx="9" cy="7" r="4" stroke="currentColor" stroke-width="1.6"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>'
  ];

  return entries
    .map(
      (entry, index) => `<article class="answer-card reveal" id="quick-answer-${index + 1}">
        <div class="answer-icon">${icons[index] ?? icons[0]}</div>
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

/* ── AI button helpers ── */

function renderAiButtons(prompt) {
  const q = prompt || `Explain the TPS (TelePrompterScript) format specification. TPS is a markdown-based file format for teleprompter scripts with hierarchical segments, blocks, phrases, inline timing/pacing markers, emotion tags, speed controls, and delivery cues. The full spec is at ${siteUrl} — help me understand how to write and parse TPS files.`;
  const chatgptUrl = `https://chatgpt.com/?q=${encodeURIComponent(q)}`;
  const claudeUrl = `https://claude.ai/new?q=${encodeURIComponent(q)}`;
  const geminiUrl = `https://gemini.google.com/app?q=${encodeURIComponent(q)}`;

  return `<a class="ai-btn ai-btn-chatgpt" href="${chatgptUrl}" target="_blank" rel="noopener">
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M22.282 9.821a5.985 5.985 0 00-.516-4.91 6.046 6.046 0 00-6.51-2.9A6.065 6.065 0 0011.782.5a6.035 6.035 0 00-5.736 4.128 5.988 5.988 0 00-3.998 2.9 6.043 6.043 0 00.743 7.097 5.98 5.98 0 00.51 4.911 6.051 6.051 0 006.515 2.9A5.985 5.985 0 0013.282 24a6.04 6.04 0 005.74-4.122 5.993 5.993 0 003.998-2.9 6.04 6.04 0 00-.738-7.157z"/></svg>
  Ask ChatGPT
</a>
<a class="ai-btn ai-btn-claude" href="${claudeUrl}" target="_blank" rel="noopener">
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M4.709 15.955l4.397-10.986a.469.469 0 01.862-.008l4.5 10.994h-2.033l-1.14-2.824H7.853l-1.122 2.824H4.709zm6.063-4.506l-1.727-4.43-1.78 4.43h3.507zM14.953 15.955V4.577h1.86v11.378h-1.86z"/></svg>
  Ask Claude
</a>
<a class="ai-btn ai-btn-gemini" href="${geminiUrl}" target="_blank" rel="noopener">
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 0C12 6.627 6.627 12 0 12c6.627 0 12 5.373 12 12 0-6.627 5.373-12 12-12-6.627 0-12-5.373-12-12z" fill="url(#gem-g)"/><defs><linearGradient id="gem-g" x1="0" y1="0" x2="24" y2="24"><stop stop-color="#4285F4"/><stop offset=".5" stop-color="#9B72CB"/><stop offset="1" stop-color="#D96570"/></linearGradient></defs></svg>
  Ask Gemini
</a>`;
}

function buildExampleAiPrompt(ex) {
  const title = ex.meta.title || ex.file;
  return `I'm looking at a TPS (TelePrompterScript) example called "${title}". TPS is a markdown-based teleprompter script format. The full spec is at ${siteUrl}. Here is the example file:\n\n${ex.content}\n\nExplain how this TPS file works — break down the structure, segments, blocks, inline markers, speed controls, emotions, and any other TPS features used.`;
}

/* ── Example helpers ── */

async function loadExamples(dir) {
  const files = (await readdir(dir)).filter(f => f.endsWith(".tps")).sort();
  const examples = [];
  for (const file of files) {
    const content = await readFile(path.join(dir, file), "utf8");
    const slug = file.replace(/\.tps$/, "");
    const meta = parseTpsFrontMatter(content);
    const body = content.replace(/^---[\s\S]*?---\s*/, "");
    examples.push({ file, slug, content, meta, body });
  }
  return examples;
}

function parseTpsFrontMatter(text) {
  const m = text.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!m) return {};
  const result = {};
  for (const line of m[1].split("\n")) {
    const kv = line.match(/^(\w+):\s*"?([^"]*)"?\s*$/);
    if (kv) result[kv[1]] = kv[2];
  }
  return result;
}

function renderExampleCards(examples) {
  const descriptions = {
    basic: "Front matter, segments, blocks, pauses, emphasis, and escape sequences.",
    advanced: "Speed controls, volume, stress marks, breath marks, emotions, pronunciation, edit points.",
    "multi-segment": "Three-act script with varying speed, emotion, and delivery cues."
  };
  return examples.map(ex => `<a class="example-link" href="examples/${ex.slug}.html">
    <strong>${escapeHtml(ex.meta.title || ex.file)}</strong>
    <span>${escapeHtml(descriptions[ex.slug] || "")}</span>
    <span class="example-badge">Editor + Teleprompter</span>
  </a>`).join("");
}

function buildExamplePage(ex, css) {
  const editorHtml = highlightTpsEditor(ex.content);
  const prompterHtml = renderTpsPrompter(ex.body, ex.meta);
  const title = ex.meta.title || ex.file;
  const exDesc = `TPS example: ${title}. A teleprompter script demonstrating the TPS format with editor, teleprompter, and raw source views.`;
  const exUrl = `${siteUrl}examples/${ex.slug}.html`;
  const exAiPrompt = buildExampleAiPrompt(ex);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)} — TPS Example</title>
  <meta name="description" content="${escapeHtml(exDesc)}">
  <meta name="keywords" content="TPS, TelePrompterScript, teleprompter example, ${escapeHtml(title)}">
  <meta name="author" content="Managed Code">
  <meta name="robots" content="index, follow, max-snippet:-1">
  <meta name="theme-color" content="#faf8f4">
  <link rel="canonical" href="${exUrl}">
  <meta property="og:title" content="${escapeHtml(title)} — TPS Example">
  <meta property="og:description" content="${escapeHtml(exDesc)}">
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="${escapeHtml(siteName)}">
  <meta property="og:url" content="${exUrl}">
  <meta property="og:image" content="${socialImageUrl}">
  <meta property="og:image:width" content="${socialImageWidth}">
  <meta property="og:image:height" content="${socialImageHeight}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(title)} — TPS Example">
  <meta name="twitter:description" content="${escapeHtml(exDesc)}">
  <meta name="twitter:image" content="${socialImageUrl}">
  <link rel="icon" href="../favicon.svg" type="image/svg+xml">
  <script type="application/ld+json">${toJsonLd({
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: `${title} — TPS Example`,
    description: exDesc,
    url: exUrl,
    isPartOf: { "@id": `${siteUrl}#website` },
    author: { "@type": "Organization", name: "Managed Code" },
    publisher: { "@type": "Organization", name: "Managed Code" },
    image: socialImageUrl,
    mainEntityOfPage: exUrl
  })}</script>
  <style>${css}</style>
</head>
<body>
  <nav class="top-nav scrolled">
    <div class="nav-inner">
      <a class="nav-logo" href="../">
        <svg width="24" height="24" viewBox="0 0 28 28" fill="none"><rect width="28" height="28" rx="8" fill="url(#ng)"/><path d="M7 9h14M7 14h10M7 19h12" stroke="#faf8f4" stroke-width="2.2" stroke-linecap="round"/><defs><linearGradient id="ng" x1="0" y1="0" x2="28" y2="28"><stop stop-color="#b8963e"/><stop offset="1" stop-color="#d4a847"/></linearGradient></defs></svg>
        <span>TPS</span>
      </a>
      <div class="nav-links">
        <a href="../#specification">Spec</a>
        <a href="../">Home</a>
        <a href="https://prompter.one" target="_blank" rel="noopener">Prompter One</a>
        <a class="nav-gh" href="https://github.com/managedcode/TPS" target="_blank" rel="noopener">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>
          GitHub
        </a>
      </div>
    </div>
  </nav>

  <div class="example-page">
    <h1>${escapeHtml(title)}</h1>
    <p class="example-meta">
      <a href="../">&larr; Back to spec</a> &middot;
      <a href="https://github.com/managedcode/TPS/blob/main/examples/${escapeHtml(ex.file)}" target="_blank" rel="noopener">View source on GitHub</a> &middot;
      ${ex.meta.base_wpm ? `${escapeHtml(ex.meta.base_wpm)} WPM` : "140 WPM"} &middot;
      ${ex.meta.duration ? escapeHtml(ex.meta.duration) : "—"}
    </p>

    <div class="ai-buttons" style="margin-bottom:1rem;">
      ${renderAiButtons(exAiPrompt)}
    </div>

    <div class="example-tabs">
      <button class="example-tab active" onclick="showTab('editor',this)">Editor View</button>
      <button class="example-tab" onclick="showTab('prompter',this)">Teleprompter View</button>
      <button class="example-tab" onclick="showTab('source',this)">Raw Source</button>
    </div>

    <div class="example-panel active" id="panel-editor">
      <div class="editor-view"><pre>${editorHtml}</pre></div>
    </div>
    <div class="example-panel" id="panel-prompter">
      <div class="prompter-view">${prompterHtml}</div>
    </div>
    <div class="example-panel" id="panel-source">
      <pre style="padding:1rem;border:1px solid var(--line);border-radius:var(--radius-lg);background:var(--bg-warm);color:var(--text);font-size:0.85rem;line-height:1.6;white-space:pre-wrap;word-wrap:break-word;"><code>${escapeHtml(ex.content)}</code></pre>
    </div>
  </div>

  <footer class="site-footer" style="max-width:960px;margin:1rem auto 2rem;padding:0 1rem;">
    <span>Copyright &copy; Managed Code</span>
    <span>Licensed under <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a></span>
  </footer>

  <script>
  function showTab(name, btn) {
    document.querySelectorAll('.example-panel').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.example-tab').forEach(t => t.classList.remove('active'));
    document.getElementById('panel-' + name).classList.add('active');
    btn.classList.add('active');
  }
  </script>
</body>
</html>`;
}

function highlightTpsEditor(content) {
  return content
    .split("\n")
    .map(line => {
      const eLine = escapeHtml(line);
      // front matter delimiters
      if (/^---\s*$/.test(line)) return `<span class="ed-frontmatter">${eLine}</span>`;
      // front matter key: value
      if (/^\w+:/.test(line) && content.indexOf("---") === 0) return `<span class="ed-frontmatter">${eLine}</span>`;
      // H1 title
      if (/^# /.test(line)) return `<strong>${eLine}</strong>`;
      // H2 segment
      if (/^## /.test(line)) return `<span class="ed-segment">${eLine}</span>`;
      // H3 block
      if (/^### /.test(line)) return `<span class="ed-block">${eLine}</span>`;
      // Highlight tags
      return eLine
        .replace(/(\[(?:pause|edit_point)[^\]]*\])/g, '<span class="ed-pause">$1</span>')
        .replace(/(\[(?:emphasis|highlight|stress|phonetic|pronunciation|breath|loud|soft|whisper|slow|fast|xslow|xfast|normal|sarcasm|aside|rhetorical|building|warm|urgent|calm|focused)\])/g, '<span class="ed-tag">$1</span>')
        .replace(/(\[\/(?:emphasis|highlight|stress|phonetic|pronunciation|loud|soft|whisper|slow|fast|xslow|xfast|normal|sarcasm|aside|rhetorical|building|warm|urgent|calm|focused)\])/g, '<span class="ed-tag">$1</span>')
        .replace(/(\[\d+WPM\])/g, '<span class="ed-tag">$1</span>')
        .replace(/(\[\/\d+WPM\])/g, '<span class="ed-tag">$1</span>')
        .replace(/(?<!\w)(\*\*[^*]+\*\*)/g, '<span class="ed-emphasis">$1</span>')
        .replace(/(?<!\w)(\*[^*]+\*)/g, '<span class="ed-emphasis">$1</span>');
    })
    .join("\n");
}

function renderTpsPrompter(body, meta) {
  const emotions = ["warm","concerned","focused","motivational","neutral","urgent","happy","excited","sad","calm","energetic","professional"];
  const lines = body.split("\n");
  let html = "";
  let currentSegment = null;
  let currentBlock = null;
  let textBuffer = [];

  function flushText() {
    if (textBuffer.length === 0) return "";
    const raw = textBuffer.join(" ").trim();
    textBuffer = [];
    if (!raw) return "";
    let t = escapeHtml(raw);
    t = t.replace(/\[emphasis\](.*?)\[\/emphasis\]/g, '<span class="pt-emphasis">$1</span>');
    t = t.replace(/\[highlight\](.*?)\[\/highlight\]/g, '<span class="pt-highlight">$1</span>');
    t = t.replace(/\[loud\](.*?)\[\/loud\]/g, '<span class="pt-loud">$1</span>');
    t = t.replace(/\[soft\](.*?)\[\/soft\]/g, '<span class="pt-soft">$1</span>');
    t = t.replace(/\[whisper\](.*?)\[\/whisper\]/g, '<span class="pt-whisper">$1</span>');
    t = t.replace(/\[slow\](.*?)\[\/slow\]/g, '<span class="pt-slow">$1</span>');
    t = t.replace(/\[fast\](.*?)\[\/fast\]/g, '<span class="pt-fast">$1</span>');
    t = t.replace(/\[xslow\](.*?)\[\/xslow\]/g, '<span class="pt-slow">$1</span>');
    t = t.replace(/\[xfast\](.*?)\[\/xfast\]/g, '<span class="pt-fast">$1</span>');
    t = t.replace(/\[normal\](.*?)\[\/normal\]/g, '$1');
    t = t.replace(/\[sarcasm\](.*?)\[\/sarcasm\]/g, '<em>$1</em>');
    t = t.replace(/\[aside\](.*?)\[\/aside\]/g, '<span class="pt-soft">$1</span>');
    t = t.replace(/\[rhetorical\](.*?)\[\/rhetorical\]/g, '<em>$1</em>');
    t = t.replace(/\[building\](.*?)\[\/building\]/g, '<span class="pt-emphasis">$1</span>');
    t = t.replace(/\[stress(?::([^\]]*))?\](.*?)\[\/stress\]/g, '<span class="pt-emphasis">$2</span>');
    t = t.replace(/\[pronunciation:[^\]]+\](.*?)\[\/pronunciation\]/g, '<span class="pt-emphasis">$1</span>');
    t = t.replace(/\[phonetic:[^\]]+\](.*?)\[\/phonetic\]/g, '<span class="pt-emphasis">$1</span>');
    t = t.replace(/\[\d+WPM\](.*?)\[\/\d+WPM\]/g, '$1');
    t = t.replace(/\[breath\]/g, ' ');
    t = t.replace(/\[pause:\d+[ms]*s?\]/g, '<span class="pt-pause">&hellip;</span>');
    t = t.replace(/\[edit_point(?::\w+)?\]/g, '<span class="pt-edit-point">&#9670; edit point</span>');
    t = t.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    t = t.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    t = t.replace(/ \/\/ /g, '<span class="pt-pause">&middot;&middot;</span> ');
    t = t.replace(/ \/ /g, '<span class="pt-pause">&middot;</span> ');
    // clean up remaining tags
    t = t.replace(/\[\/?(?:warm|urgent|calm|focused|concerned|motivational|excited|happy|sad|energetic|professional|neutral)\]/g, '');
    return `<p class="prompter-text">${t}</p>`;
  }

  function closeSegment() {
    html += flushText();
    if (currentSegment) html += "</div>";
    currentSegment = null;
    currentBlock = null;
  }

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) { html += flushText(); continue; }

    const segMatch = trimmed.match(/^##\s+(?:\[([^\]]+)\]|(.+))$/);
    if (segMatch) {
      closeSegment();
      const params = (segMatch[1] || segMatch[2]).split("|").map(s => s.trim());
      const name = params[0];
      let emo = "neutral";
      for (const p of params.slice(1)) {
        if (emotions.includes(p.toLowerCase())) emo = p.toLowerCase();
      }
      currentSegment = { name, emotion: emo };
      html += `<div class="prompter-segment emo-${emo}">`;
      html += `<div class="prompter-segment-name"><span class="seg-dot"></span>${escapeHtml(name)} &middot; ${emo}</div>`;
      continue;
    }

    const blockMatch = trimmed.match(/^###\s+(?:\[([^\]]+)\]|(.+))$/);
    if (blockMatch) {
      html += flushText();
      const params = (blockMatch[1] || blockMatch[2]).split("|").map(s => s.trim());
      currentBlock = params[0];
      html += `<div class="prompter-block-name">${escapeHtml(params[0])}</div>`;
      continue;
    }

    if (/^#\s/.test(trimmed)) continue; // skip h1

    textBuffer.push(trimmed);
  }

  closeSegment();
  return `<div class="prompter-inner">${html}</div>`;
}
