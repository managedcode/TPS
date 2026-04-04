import { cp, mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import hljs from "highlight.js";
import MarkdownIt from "markdown-it";
import markdownItAnchor from "markdown-it-anchor";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const readmePath = path.join(rootDir, "README.md");
const glossaryPath = path.join(rootDir, "docs", "Glossary.md");
const versionPath = path.join(rootDir, "VERSION");
const sdkManifestPath = path.join(rootDir, "SDK", "manifest.json");
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
const glossaryMarkdown = await readFile(glossaryPath, "utf8");
const version = normalizeVersion(await readFile(versionPath, "utf8"));
const sdkManifest = JSON.parse(await readFile(sdkManifestPath, "utf8"));
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
const glossaryHtml = enhanceArticleHtml(md.render(glossaryMarkdown));
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
const sdkRuntimes = sdkManifest.runtimes;

await rm(distDir, { recursive: true, force: true });
await mkdir(distDir, { recursive: true });
await mkdir(path.join(distDir, "examples"), { recursive: true });
await mkdir(path.join(distDir, "sdk"), { recursive: true });
await mkdir(path.join(distDir, "glossary"), { recursive: true });
await cp(publicDir, distDir, { recursive: true });

const page = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)} — Open Teleprompter Script Format</title>
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
  <!-- Google tag (gtag.js) -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-1CM82SNSD5"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());

    gtag('config', 'G-1CM82SNSD5');
  </script>
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
        <span>TPS Format</span>
      </a>
      <div class="nav-links">
        <a href="#specification">Spec</a>
        <a href="#complete-example">Example</a>
        <a href="./glossary/">Glossary</a>
        <a href="./sdk/">SDK</a>
        <a href="https://github.com/managedcode/PrompterOne" target="_blank" rel="noopener">Prompter One</a>
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
        <span class="eyebrow">Open Spec</span>
        <h1 class="hero-title"><span class="hero-title-mark">TPS</span><span class="hero-title-main">Format Specification</span></h1>
        <p class="hero-title-sub">TelePrompterScript</p>
        <p class="hero-story">Plain text tells you <em>what</em> to say. But a speaker needs to know <em>how</em> to say it &mdash; where to pause, when to slow down, how to shift from concern to confidence. Existing formats ignore delivery entirely. TPS fixes that: it embeds pace, emotion, and timing directly into readable markdown.</p>
        <ul class="hero-signals" aria-label="Format highlights">
          <li><svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M2 3h12M2 7h8M2 11h10" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>Write in any text editor &mdash; it's just markdown</li>
          <li><svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.6"/><path d="M8 4v4l3 2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>Control pacing: 140 WPM default, per-segment speed overrides</li>
          <li><svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M8 2a6 6 0 100 12A6 6 0 008 2z" stroke="currentColor" stroke-width="1.6"/><path d="M6 8.5l1.5 1.5L10 7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>12 emotion presets: warm, urgent, calm, focused, and more</li>
        </ul>
        <div class="hero-actions">
          <a class="button button-primary" href="#specification">Read the Spec</a>
          <a class="button button-secondary" href="./sdk/">Browse SDKs</a>
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
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M10 16V4m0 0l-5 5m5-5l5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
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

    // All external links open in new tabs
    document.querySelectorAll('a[href^="http"]').forEach(function(a) {
      if (a.hostname !== location.hostname) {
        a.setAttribute('target', '_blank');
        a.setAttribute('rel', 'noopener');
      }
    });
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
await writeFile(path.join(distDir, "sdk", "index.html"), buildSdkIndexPage(sdkRuntimes, styles), "utf8");
await writeFile(path.join(distDir, "glossary", "index.html"), buildGlossaryPage(glossaryHtml, styles), "utf8");

await writeFile(path.join(distDir, "sitemap.xml"), buildSitemapXml(siteUrl, dateModifiedIso, tpsExamples), "utf8");
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
  let result = decorateEmotionTable(html);
  result = highlightTpsCodeBlocks(result);
  // Rewrite examples/*.tps links to examples/*.html for the website
  result = result.replace(/href="examples\/([^"]+)\.tps"/g, 'href="examples/$1.html"');
  return result;
}

function highlightTpsCodeBlocks(html) {
  // Highlight TPS syntax inside plain code blocks (no language specified)
  return html.replace(/<pre class="hljs"><code>([\s\S]*?)<\/code><\/pre>/g, (match, code) => {
    // Only process blocks that look like TPS content
    if (!code.includes("[") && !code.includes("##") && !code.includes("---")) return match;
    let t = code;
    // Front matter delimiters
    t = t.replace(/^(---)\s*$/gm, '<span style="color:var(--text-faint)">$1</span>');
    // YAML keys in front matter
    t = t.replace(/^(\w+)(:)/gm, '<span style="color:var(--tps-purple);font-weight:600">$1</span><span style="color:var(--text-faint)">$2</span>');
    // String values
    t = t.replace(/(&quot;[^&]*&quot;)/g, '<span style="color:var(--tps-green)">$1</span>');
    // Segment headers ## [...]
    t = t.replace(/(## \[[^\]]+\])/g, '<span style="color:var(--gold-accent,#C4A060);font-weight:700">$1</span>');
    // Block headers ### [...]
    t = t.replace(/(### \[[^\]]+\])/g, '<span style="color:var(--tps-blue);font-weight:700">$1</span>');
    // H1 title
    t = t.replace(/^(# .+)$/gm, '<span style="font-weight:700">$1</span>');
    // TPS tags [tag]...[/tag]
    t = t.replace(/(\[(?:emphasis|highlight|stress|loud|soft|whisper|slow|fast|xslow|xfast|normal|sarcasm|aside|rhetorical|building)\])/g, '<span style="color:var(--tps-purple)">$1</span>');
    t = t.replace(/(\[\/(?:emphasis|highlight|stress|loud|soft|whisper|slow|fast|xslow|xfast|normal|sarcasm|aside|rhetorical|building)\])/g, '<span style="color:var(--tps-purple)">$1</span>');
    // Pause tags
    t = t.replace(/(\[pause:[^\]]+\])/g, '<span style="color:var(--tps-red);font-weight:600">$1</span>');
    t = t.replace(/(\[edit_point[^\]]*\])/g, '<span style="color:var(--tps-red);font-weight:600">$1</span>');
    t = t.replace(/(\[breath\])/g, '<span style="color:var(--tps-teal)">$1</span>');
    // WPM tags
    t = t.replace(/(\[\d+WPM\])/g, '<span style="color:var(--tps-orange);font-weight:600">$1</span>');
    t = t.replace(/(\[\/\d+WPM\])/g, '<span style="color:var(--tps-orange)">$1</span>');
    // Pronunciation/phonetic
    t = t.replace(/(\[(?:phonetic|pronunciation):[^\]]+\])/g, '<span style="color:var(--tps-cyan)">$1</span>');
    t = t.replace(/(\[\/(?:phonetic|pronunciation)\])/g, '<span style="color:var(--tps-cyan)">$1</span>');
    // Comments (# at position after spaces)
    t = t.replace(/( {2,})(#.*)$/gm, '$1<span style="color:var(--text-faint);font-style:italic">$2</span>');
    // Emotion names in segment headers
    t = t.replace(/(\|)(Warm|Concerned|Focused|Motivational|Neutral|Urgent|Happy|Excited|Sad|Calm|Energetic|Professional)(\||\])/gi,
      '$1<span style="color:var(--emo-' + '$2'.toLowerCase() + ',var(--tps-orange))">$2</span>$3');
    return `<pre class="hljs"><code>${t}</code></pre>`;
  });
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
      answer: "TPS (TelePrompterScript) is a markdown-based file format for teleprompter scripts with built-in timing, pacing, emotional cues, and delivery instructions."
    },
    {
      question: "Who is TPS for?",
      answer: "TPS is designed for script authors, teleprompter app developers, and production teams that need readable source files with structured playback guidance."
    },
    {
      question: "What makes TPS different?",
      answer: "Unlike plain markdown, SubRip, or WebVTT, TPS is purpose-built for teleprompter delivery with hierarchical segments, pacing markers, emotion tags, and edit points."
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

function buildSitemapXml(siteUrl, dateModifiedIso, examples = []) {
  const exampleUrls = examples.map(ex => `  <url>
    <loc>${siteUrl}examples/${ex.slug}.html</loc>
    <lastmod>${dateModifiedIso}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${siteUrl}</loc>
    <lastmod>${dateModifiedIso}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${siteUrl}examples/</loc>
    <lastmod>${dateModifiedIso}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${siteUrl}glossary/</loc>
    <lastmod>${dateModifiedIso}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>${siteUrl}sdk/</loc>
    <lastmod>${dateModifiedIso}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
${exampleUrls}
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

function buildAiButtonsHtml(chatgptUrl, claudeUrl, geminiUrl) {
  return `<a class="ai-btn ai-btn-chatgpt" href="${chatgptUrl}" target="_blank" rel="noopener">
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M22.282 9.821a5.985 5.985 0 00-.516-4.91 6.046 6.046 0 00-6.51-2.9A6.065 6.065 0 0011.782.5a6.035 6.035 0 00-5.736 4.128 5.988 5.988 0 00-3.998 2.9 6.043 6.043 0 00.743 7.097 5.98 5.98 0 00.51 4.911 6.051 6.051 0 006.515 2.9A5.985 5.985 0 0013.282 24a6.04 6.04 0 005.74-4.122 5.993 5.993 0 003.998-2.9 6.04 6.04 0 00-.738-7.157z"/></svg>
  Ask ChatGPT
</a>
<a class="ai-btn ai-btn-claude" href="${claudeUrl}" target="_blank" rel="noopener">
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M4.709 15.955l4.397-10.986a.469.469 0 01.862-.008l4.5 10.994h-2.033l-1.14-2.824H7.853l-1.122 2.824H4.709zm6.063-4.506l-1.727-4.43-1.78 4.43h3.507zM14.953 15.955V4.577h1.86v11.378h-1.86z"/></svg>
  Ask Claude
</a>
<a class="ai-btn ai-btn-gemini" href="${geminiUrl}" target="_blank" rel="noopener">
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 0C12 6.627 6.627 12 0 12c6.627 0 12 5.373 12 12 0-6.627 5.373-12 12-12-6.627 0-12-5.373-12-12z" fill="url(#gem-g)"/><defs><linearGradient id="gem-g" x1="0" y1="0" x2="24" y2="24"><stop stop-color="#4285F4"/><stop offset=".5" stop-color="#9B72CB"/><stop offset="1" stop-color="#D96570"/></linearGradient></defs></svg>
  Ask Gemini
</a>`;
}

function renderAiButtons(prompt) {
  const q = prompt || buildMainPagePrompt();
  return buildAiButtonsHtml(
    `https://chatgpt.com/?q=${encodeURIComponent(q)}`,
    `https://claude.ai/new?q=${encodeURIComponent(q)}`,
    `https://gemini.google.com/app?q=${encodeURIComponent(q)}`
  );
}

function buildMainPagePrompt() {
  return [
    `I want to learn about the TPS (TelePrompterScript) format.`,
    ``,
    `TPS is an open-source, markdown-based file format designed for teleprompter scripts. It was created by Managed Code (https://www.managed-code.com/).`,
    ``,
    `Key concepts:`,
    `- Scripts are organized hierarchically: Segments (## headers) → Blocks (### headers) → Phrases → Words`,
    `- Each level can set its own WPM (words per minute) speed and emotion`,
    `- Inline markers control delivery: [pause:2s], [emphasis], [highlight], [loud], [soft], [whisper], speed tags like [slow]...[/slow], [fast]...[/fast]`,
    `- 12 emotion presets (warm, concerned, focused, motivational, neutral, urgent, happy, excited, sad, calm, energetic, professional) control visual styling and delivery tone`,
    `- Front matter (YAML) sets document-level defaults: title, base_wpm, speed_offsets, author, duration`,
    ``,
    `Resources:`,
    `- Full specification: ${siteUrl}`,
    `- Interactive examples: ${siteUrl}examples/`,
    `- GitHub repository: ${repoUrl}`,
    `- Prompter One (open-source editor & teleprompter implementing TPS): https://prompter.one`,
    `- Prompter One source code: https://github.com/managedcode/PrompterOne`,
    ``,
    `Please explain:`,
    `1. What problem does TPS solve compared to plain text, SubRip (.srt), or WebVTT?`,
    `2. How is a TPS file structured (front matter, segments, blocks, inline markers)?`,
    `3. How do emotions and speed controls work?`,
    `4. How would I write my first TPS script for a 2-minute presentation?`,
  ].join("\n");
}

function buildExampleAiPrompt(ex) {
  const title = ex.meta.title || ex.file;
  const segments = [];
  const blocks = [];
  const features = new Set();

  for (const line of ex.body.split("\n")) {
    const segMatch = line.match(/^##\s+(?:\[([^\]]+)\]|(.+))$/);
    if (segMatch) {
      const params = (segMatch[1] || segMatch[2]).split("|").map(s => s.trim());
      segments.push(params.join(" | "));
    }
    const blkMatch = line.match(/^###\s+(?:\[([^\]]+)\]|(.+))$/);
    if (blkMatch) blocks.push((blkMatch[1] || blkMatch[2]).split("|")[0].trim());

    if (/\[pause:/.test(line)) features.add("timed pauses [pause:Ns]");
    if (/\[emphasis\]/.test(line)) features.add("emphasis tags");
    if (/\[highlight\]/.test(line)) features.add("highlight markers");
    if (/\[slow\]|\[fast\]|\[xslow\]|\[xfast\]/.test(line)) features.add("speed controls (slow/fast/xslow/xfast)");
    if (/\[\d+WPM\]/.test(line)) features.add("absolute WPM speed overrides");
    if (/\[loud\]|\[soft\]|\[whisper\]/.test(line)) features.add("volume tags (loud/soft/whisper)");
    if (/\[edit_point/.test(line)) features.add("edit points");
    if (/\[stress/.test(line)) features.add("syllable stress marks");
    if (/\[phonetic:|\[pronunciation:/.test(line)) features.add("pronunciation guides");
    if (/\[breath\]/.test(line)) features.add("breath marks");
    if (/\[sarcasm\]|\[aside\]|\[rhetorical\]|\[building\]/.test(line)) features.add("delivery mode tags");
    if (/\*\*[^*]+\*\*/.test(line)) features.add("markdown bold emphasis");
    if (/ \/ | \/\//.test(line)) features.add("short/medium pause markers (/ and //)");
  }

  return [
    `I'm studying a TPS (TelePrompterScript) example called "${title}".`,
    `TPS is an open-source markdown-based teleprompter format. Full spec: ${siteUrl}`,
    ``,
    `This example has ${segments.length} segment(s) and ${blocks.length} block(s):`,
    ``,
    `Segments: ${segments.join("; ")}`,
    `Blocks: ${blocks.join(", ")}`,
    ``,
    `TPS features used in this file:`,
    ...[...features].map(f => `- ${f}`),
    ``,
    `Here is the complete file:`,
    ``,
    "```",
    ex.content,
    "```",
    ``,
    `Please explain this TPS file block by block:`,
    `1. What does the front matter configure?`,
    `2. Walk through each segment — what emotion and speed does it set, and why?`,
    `3. Inside each block — what inline markers are used and what effect do they have on delivery?`,
    `4. How would a teleprompter app (like Prompter One: https://prompter.one) render this script visually?`,
  ].join("\n");
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

  const prompterHtml = renderTpsPrompter(ex.body, ex.meta);
  const title = ex.meta.title || ex.file;
  const exDesc = `TPS example: ${title}. A teleprompter script demonstrating the TPS format with teleprompter and raw source views.`;
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
        <svg width="24" height="24" viewBox="0 0 28 28" fill="none" aria-hidden="true"><rect width="28" height="28" rx="8" fill="url(#ng)"/><path d="M7 9h14M7 14h10M7 19h12" stroke="#faf8f4" stroke-width="2.2" stroke-linecap="round"/><defs><linearGradient id="ng" x1="0" y1="0" x2="28" y2="28"><stop stop-color="#b8963e"/><stop offset="1" stop-color="#d4a847"/></linearGradient></defs></svg>
        <span>TPS Format</span>
      </a>
      <div class="nav-links">
        <a href="../#specification">Spec</a>
        <a href="../glossary/">Glossary</a>
        <a href="../sdk/">SDK</a>
        <a href="../">Home</a>
        <a href="https://prompter.one" target="_blank" rel="noopener">Prompter One</a>
        <a class="nav-gh" href="https://github.com/managedcode/TPS" target="_blank" rel="noopener">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>
          GitHub
        </a>
      </div>
    </div>
  </nav>

  <div class="example-page">
    <h1>${escapeHtml(title)} <small>— TPS Example</small></h1>
    <p class="example-meta">
      <a href="../">&larr; Back to spec</a> &middot;
      <a href="../glossary/">TPS glossary</a> &middot;
      <a href="https://github.com/managedcode/TPS/blob/main/examples/${escapeHtml(ex.file)}" target="_blank" rel="noopener">View source on GitHub</a> &middot;
      ${ex.meta.base_wpm ? `${escapeHtml(ex.meta.base_wpm)} WPM` : "140 WPM"} base speed &middot;
      ${ex.meta.duration ? `${escapeHtml(ex.meta.duration)} duration` : ""}
    </p>
    <p class="example-desc">${escapeHtml(exDesc)}</p>

    <div class="ai-buttons">
      ${renderAiButtons(exAiPrompt)}
    </div>

    <h2>Teleprompter View</h2>
    <p class="example-section-desc">How <a href="https://prompter.one" target="_blank" rel="noopener">Prompter One</a> renders this script for the speaker &mdash; dark background, emotion-colored segments, emphasis underlines, pause markers, and a spotlight reading zone.</p>
    <div class="prompter-view">${prompterHtml}</div>

    <h2>Raw Source</h2>
    <p class="example-section-desc">The complete <code>.tps</code> file &mdash; valid markdown you can open in any text editor.</p>
    <pre class="example-raw-source"><code>${escapeHtml(ex.content)}</code></pre>
  </div>

  <footer class="site-footer example-footer">
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

    // Process TPS tags on raw text BEFORE HTML escaping
    let t = raw;

    // Remove all paired TPS tags, keeping only inner text with styling
    // Use placeholder tokens to avoid HTML escaping issues
    const PH = "\x00"; // placeholder prefix
    const spans = [];
    function span(cls, content) {
      const idx = spans.length;
      spans.push(`<span class="${cls}">${escapeHtml(content)}</span>`);
      return `${PH}${idx}${PH}`;
    }
    function spanRaw(html) {
      const idx = spans.length;
      spans.push(html);
      return `${PH}${idx}${PH}`;
    }

    // Paired tags — process innermost first
    t = t.replace(/\[emphasis\](.*?)\[\/emphasis\]/g, (_, c) => span("pt-emphasis", c));
    t = t.replace(/\[highlight\](.*?)\[\/highlight\]/g, (_, c) => span("pt-highlight", c));
    t = t.replace(/\[loud\](.*?)\[\/loud\]/g, (_, c) => span("pt-loud", c));
    t = t.replace(/\[soft\](.*?)\[\/soft\]/g, (_, c) => span("pt-soft", c));
    t = t.replace(/\[whisper\](.*?)\[\/whisper\]/g, (_, c) => span("pt-whisper", c));
    t = t.replace(/\[slow\](.*?)\[\/slow\]/g, (_, c) => span("pt-slow", c));
    t = t.replace(/\[fast\](.*?)\[\/fast\]/g, (_, c) => span("pt-fast", c));
    t = t.replace(/\[xslow\](.*?)\[\/xslow\]/g, (_, c) => span("pt-xslow", c));
    t = t.replace(/\[xfast\](.*?)\[\/xfast\]/g, (_, c) => span("pt-xfast", c));
    t = t.replace(/\[normal\](.*?)\[\/normal\]/g, "$1");
    t = t.replace(/\[sarcasm\](.*?)\[\/sarcasm\]/g, (_, c) => span("pt-soft", c));
    t = t.replace(/\[aside\](.*?)\[\/aside\]/g, (_, c) => span("pt-soft", c));
    t = t.replace(/\[rhetorical\](.*?)\[\/rhetorical\]/g, (_, c) => span("pt-emphasis", c));
    t = t.replace(/\[building\](.*?)\[\/building\]/g, (_, c) => span("pt-emphasis", c));
    t = t.replace(/\[stress(?::([^\]]*))?\](.*?)\[\/stress\]/g, (_, _g, c) => span("pt-emphasis", c));
    t = t.replace(/\[pronunciation:[^\]]+\](.*?)\[\/pronunciation\]/g, (_, c) => span("pt-emphasis", c));
    t = t.replace(/\[phonetic:[^\]]+\](.*?)\[\/phonetic\]/g, (_, c) => span("pt-emphasis", c));
    t = t.replace(/\[\d+WPM\](.*?)\[\/\d+WPM\]/g, "$1");

    // Standalone markers
    t = t.replace(/\[breath\]/g, " ");
    t = t.replace(/\[pause:\d+[ms]*s?\]/g, () => spanRaw('<span class="pt-pause-long"></span>'));
    t = t.replace(/\[edit_point(?::\w+)?\]/g, () => spanRaw('<span class="pt-edit-point">&#9670; edit point</span>'));

    // Emotion tags (opening/closing)
    t = t.replace(/\[\/?(?:warm|urgent|calm|focused|concerned|motivational|excited|happy|sad|energetic|professional|neutral)\]/g, "");

    // Markdown emphasis
    t = t.replace(/\*\*([^*]+)\*\*/g, (_, c) => span("pt-loud", c));
    t = t.replace(/\*([^*]+)\*/g, (_, c) => span("pt-emphasis", c));

    // Pause slashes — MUST come after tag processing
    // // = medium pause, / = short pause
    t = t.replace(/ \/\/ ?/g, () => spanRaw(' <span class="pt-pause-med"></span> '));
    t = t.replace(/ \/ ?/g, () => spanRaw(' <span class="pt-pause-dot"></span> '));
    // Handle line-ending slashes
    t = t.replace(/\/\/$/g, () => spanRaw('<span class="pt-pause-med"></span>'));
    t = t.replace(/\/$/g, () => spanRaw('<span class="pt-pause-dot"></span>'));

    // Now escape the remaining plain text and restore spans
    const parts = t.split(new RegExp(`${PH}(\\d+)${PH}`));
    let result = "";
    for (let i = 0; i < parts.length; i++) {
      if (i % 2 === 0) {
        result += escapeHtml(parts[i]);
      } else {
        result += spans[parseInt(parts[i], 10)];
      }
    }

    // Clean up any remaining raw brackets that slipped through
    result = result.replace(/\[[^\]]*\]/g, "");

    return result.trim() ? `<p class="prompter-text">${result.trim()}</p>` : "";
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

function buildExamplesIndexPage(examples, css) {
  const descriptions = {
    basic: "Front matter, segments, blocks, pauses, emphasis, and escape sequences.",
    advanced: "Speed controls, volume, stress marks, breath marks, emotions, pronunciation, edit points.",
    "multi-segment": "Three-act script with varying speed, emotion, and delivery cues."
  };

  const cards = examples.map(ex => {
    const desc = descriptions[ex.slug] || "";
    return `<a class="example-link" href="${ex.slug}.html">
      <strong>${escapeHtml(ex.meta.title || ex.file)}</strong>
      <span>${escapeHtml(desc)}</span>
      <div class="example-tags">
        <span class="example-badge">Editor</span>
        <span class="example-badge">Teleprompter</span>
        <span class="example-badge">Source</span>
      </div>
    </a>`;
  }).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>TPS Examples — TelePrompterScript</title>
  <meta name="description" content="Interactive TPS format examples showing teleprompter and raw source views for basic, advanced, and multi-segment teleprompter scripts.">
  <meta name="robots" content="index, follow">
  <meta name="theme-color" content="#faf8f4">
  <link rel="canonical" href="${siteUrl}examples/">
  <meta property="og:title" content="TPS Examples">
  <meta property="og:description" content="Interactive TPS format examples with teleprompter and raw source views.">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${siteUrl}examples/">
  <meta property="og:image" content="${socialImageUrl}">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="icon" href="../favicon.svg" type="image/svg+xml">
  <style>${css}</style>
</head>
<body>
  <nav class="top-nav scrolled">
    <div class="nav-inner">
      <a class="nav-logo" href="../">
        <svg width="24" height="24" viewBox="0 0 28 28" fill="none" aria-hidden="true"><rect width="28" height="28" rx="8" fill="url(#ng)"/><path d="M7 9h14M7 14h10M7 19h12" stroke="#faf8f4" stroke-width="2.2" stroke-linecap="round"/><defs><linearGradient id="ng" x1="0" y1="0" x2="28" y2="28"><stop stop-color="#8B7355"/><stop offset="1" stop-color="#C4A060"/></linearGradient></defs></svg>
        <span>TPS Format</span>
      </a>
      <div class="nav-links">
        <a href="../#specification">Spec</a>
        <a href="../glossary/">Glossary</a>
        <a href="../sdk/">SDK</a>
        <a href="../">Home</a>
        <a href="https://prompter.one" target="_blank" rel="noopener">Prompter One</a>
        <a class="nav-gh" href="https://github.com/managedcode/TPS" target="_blank" rel="noopener">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>
          GitHub
        </a>
      </div>
    </div>
  </nav>

  <div class="example-page">
    <h1>TPS Examples</h1>
    <p class="example-meta">
      <a href="../">&larr; Back to spec</a> &middot;
      Interactive examples showing how TPS scripts look in a teleprompter.
    </p>
    <div class="ai-buttons">
      ${renderAiButtons()}
    </div>
    <div class="prompter-view">
      <div class="prompter-inner">
        <div class="prompter-segment emo-warm">
          <div class="prompter-segment-name"><span class="seg-dot"></span>DEMO &middot; WARM</div>
          <p class="prompter-text">Every great presentation starts with a story. <span class="pt-pause-dot"></span> TPS lets you <span class="pt-emphasis">write that story</span> in plain markdown <span class="pt-pause-dot"></span> while embedding everything a teleprompter needs: <span class="pt-pause-med"></span> pace, <span class="pt-pause-dot"></span> emotion, <span class="pt-pause-dot"></span> and timing.</p>
        </div>
        <div class="prompter-segment emo-focused">
          <div class="prompter-segment-name"><span class="seg-dot"></span>FEATURES &middot; FOCUSED</div>
          <p class="prompter-text"><span class="pt-emphasis">Twelve emotions.</span> <span class="pt-pause-dot"></span> Speed from <span class="pt-slow">84 WPM</span> to <span class="pt-fast">210 WPM.</span> <span class="pt-pause-med"></span> <span class="pt-highlight">Highlights</span>, <span class="pt-loud">volume control</span>, <span class="pt-soft">whispers</span>, breath marks, and edit points.</p>
        </div>
      </div>
    </div>

    <h2>Choose an Example</h2>
    <div class="examples-grid">
      ${cards}
    </div>

    <div class="examples-info-box">
      <p>Each example shows two views: the <strong>Teleprompter View</strong> (how <a href="https://prompter.one" target="_blank" rel="noopener">Prompter One</a> renders it for reading) and the <strong>Raw Source</strong> (the <code>.tps</code> file you can copy and use).</p>
    </div>
  </div>

  <footer class="site-footer examples-index-footer">
    <span>Copyright &copy; <a href="https://www.managed-code.com/" target="_blank" rel="noopener">Managed Code</a></span>
    <span>Licensed under <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a></span>
  </footer>
</body>
</html>`;
}

function buildSdkIndexPage(runtimes, css) {
  const sdkUrl = `${siteUrl}sdk/`;
  const activeRuntimes = runtimes.filter(runtime => runtime.enabled);
  const plannedRuntimes = runtimes.filter(runtime => !runtime.enabled);
  const activeCount = activeRuntimes.length;
  const plannedCount = plannedRuntimes.length;
  const coverageCount = activeRuntimes.filter(runtime => Boolean(runtime.coverage)).length;
  const runtimeIcons = {
    typescript: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="2.5" y="2.5" width="19" height="19" rx="5" fill="#3178C6"/><path d="M7.8 8.2h8.4v2H13v6.1h-2.4v-6.1H7.8v-2Zm7.2 0h6.2v1.9h-1.8c-.7 0-1.1.2-1.1.7 0 .4.3.7 1.2 1l.6.2c1.6.5 2.3 1.3 2.3 2.6 0 1.7-1.4 2.8-3.7 2.8-1.3 0-2.5-.3-3.5-.9v-2.1c1 .7 2.1 1 3.1 1 .8 0 1.2-.2 1.2-.7 0-.4-.3-.6-1.1-.9l-.7-.2c-1.7-.5-2.4-1.4-2.4-2.7 0-1.6 1.3-2.8 3.6-2.8.9 0 1.9.2 2.8.5v2c-.9-.4-1.8-.6-2.6-.6-.8 0-1.2.2-1.2.6 0 .3.3.5 1.1.8l.8.2c1.8.6 2.5 1.4 2.5 2.8 0 1.8-1.4 2.9-3.8 2.9-1.4 0-2.6-.3-3.7-.9v-2.2c1.1.8 2.3 1.2 3.5 1.2.8 0 1.2-.3 1.2-.7 0-.4-.3-.6-1.2-.9l-.8-.2c-1.7-.5-2.4-1.3-2.4-2.6 0-1.7 1.4-2.8 3.7-2.8.9 0 1.8.1 2.7.4V8.2H15Z" fill="#fff"/></svg>',
    javascript: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="2.5" y="2.5" width="19" height="19" rx="5" fill="#F7DF1E"/><path d="M13.1 8.1h2.3v6.6c0 2-.9 3.1-2.9 3.1-.9 0-1.6-.2-2.3-.7l.6-1.8c.4.3.8.4 1.2.4.7 0 1.1-.4 1.1-1.4V8.1Zm4 8.7.7-1.8c.7.5 1.6.8 2.4.8 1 0 1.5-.3 1.5-.9 0-.5-.4-.8-1.6-1.2l-.4-.1c-1.8-.6-2.8-1.5-2.8-3 0-1.8 1.4-3 3.6-3 1.1 0 2.1.2 3 .7l-.7 1.8c-.8-.4-1.6-.6-2.3-.6-.9 0-1.4.3-1.4.8 0 .5.4.7 1.6 1.1l.4.1c1.9.6 2.8 1.5 2.8 3.1 0 1.9-1.5 3.1-3.9 3.1-1.3 0-2.6-.3-3.5-.9Z" fill="#1F2328"/></svg>',
    dotnet: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="2.5" y="2.5" width="19" height="19" rx="5" fill="#68217A"/><text x="12" y="15" text-anchor="middle" font-size="8.2" font-weight="700" fill="#fff" font-family="ui-sans-serif, system-ui, -apple-system, sans-serif">C#</text></svg>',
    flutter: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="2.5" y="2.5" width="19" height="19" rx="5" fill="#EAF4FF"/><path d="M7 14.7 13.9 8h3.2l-6.9 6.7H7Zm3.2 3.3 3.7-3.6h3.2L13.4 18h-3.2Zm0-3.4 1.6-1.5 5.3 5.1h-3.2l-3.7-3.6Z" fill="#47C5FB"/><path d="M10.2 14.6 13.9 18h3.2l-5.3-5.1-1.6 1.7Z" fill="#00569E"/></svg>',
    swift: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="2.5" y="2.5" width="19" height="19" rx="5" fill="#F05138"/><path d="M17.7 15.5c-.5.3-1 .5-1.5.6-1 .2-2-.1-2.8-.7-1-.7-1.8-1.7-2.7-2.7.5.4 1 .8 1.6 1.1 1.2.7 2.3 1 3.4.9-1-.4-2-.9-3-1.6-1.5-1-2.6-2.1-3.3-3.3.9.8 2 1.5 3.1 2.1-.8-.7-1.5-1.5-2-2.4-.5-.8-.8-1.6-.9-2.3.8 1 1.8 2 3 2.8 1.2.9 2.5 1.6 3.8 2.1.1-.2.2-.5.2-.8 0-1.1-.5-2.1-1.4-2.9 1.4.7 2.5 2 2.8 3.5.2 1.1 0 2.3-.6 3.3.5.3.9.7 1.2 1.3-.4-.3-.7-.5-.9-.6Z" fill="#fff2e8"/></svg>',
    java: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="2.5" y="2.5" width="19" height="19" rx="5" fill="#F5F1EA"/><path d="M13.6 6.8c1 .8-1.2 1.4-.4 2.4.4.5 1.2.7 1.2 1.6 0 .7-.5 1.3-1.4 1.8.5-.6.6-1.1.4-1.5-.3-.5-.9-.7-1.1-1.3-.3-.8.3-1.5 1.3-3Z" fill="#EA2D2E"/><path d="M9.3 15.2h5.8c.6 0 1-.4 1-1v-.2h1v.2c0 1.1-.9 2-2 2H9.3c-1.1 0-2-.9-2-2V11h1v3.2c0 .6.4 1 1 1Z" fill="#3A75B0"/><path d="M9.5 11.4h6v.9h-6v-.9Zm.8 1.7h4.4v.8h-4.4v-.8Z" fill="#3A75B0"/></svg>'
  };
  const runtimeDetails = {
    typescript: {
      summary: "Reference TPS runtime and source of truth for cross-SDK behavior.",
      chips: ["Reference"],
      facts: [
        { label: "Status", valueHtml: "Active reference runtime with CI and coverage gating." },
        { label: "Workspace", valueHtml: "<code>SDK/ts</code>." }
      ]
    },
    javascript: {
      summary: "Built JavaScript runtime for consumers, generated from the TypeScript source.",
      chips: ["Package"],
      facts: [
        { label: "Status", valueHtml: "Active consumer runtime with CI and coverage gating." },
        { label: "Package", valueHtml: "<code>managedcode.tps</code>." },
        { label: "Workspace", valueHtml: "<code>SDK/js</code>." }
      ]
    },
    dotnet: {
      summary: "ManagedCode.Tps runtime for .NET consumers.",
      chips: ["ManagedCode.Tps", "C#"],
      facts: [
        { label: "Status", valueHtml: "Active C# runtime with CI and coverage gating." },
        { label: "Namespace", valueHtml: "<code>ManagedCode.Tps</code>." },
        { label: "Workspace", valueHtml: "<code>SDK/dotnet</code>." }
      ]
    },
    flutter: {
      summary: "Dart runtime for Flutter hosts with parser, compiler, validation, and playback parity tests.",
      chips: ["Dart", "Flutter Apps"],
      facts: [
        { label: "Status", valueHtml: "Active Dart runtime for Flutter embedding with CI and coverage gating." },
        { label: "Package", valueHtml: "<code>managedcode_tps</code>." },
        { label: "Workspace", valueHtml: "<code>SDK/flutter</code>." }
      ]
    },
    swift: {
      summary: "Native Swift package with compile, restore, and timed playback APIs for Apple-platform hosts.",
      chips: ["SwiftPM", "Apple"],
      facts: [
        { label: "Status", valueHtml: "Active Swift runtime package with CI, parity tests, and coverage gating." },
        { label: "Package", valueHtml: "<code>ManagedCodeTps</code>." },
        { label: "Workspace", valueHtml: "<code>SDK/swift</code>." }
      ]
    },
    java: {
      summary: "Standalone Java runtime with compile, restore, transport, and live playback support.",
      chips: ["JVM", "Standalone"],
      facts: [
        { label: "Status", valueHtml: "Active Java runtime with transport parity, CI, and coverage gating." },
        { label: "Package", valueHtml: "<code>com.managedcode.tps</code>." },
        { label: "Workspace", valueHtml: "<code>SDK/java</code>." }
      ]
    }
  };
  const runtimeColors = {
    typescript: { accent: '#3178C6', soft: 'rgba(49,120,198,0.08)', border: 'rgba(49,120,198,0.18)' },
    javascript: { accent: '#F0DB4F', soft: 'rgba(240,219,79,0.10)', border: 'rgba(240,219,79,0.22)' },
    dotnet: { accent: '#68217A', soft: 'rgba(104,33,122,0.08)', border: 'rgba(104,33,122,0.18)' },
    flutter: { accent: '#47C5FB', soft: 'rgba(71,197,251,0.08)', border: 'rgba(71,197,251,0.15)' },
    swift: { accent: '#F05138', soft: 'rgba(240,81,56,0.08)', border: 'rgba(240,81,56,0.15)' },
    java: { accent: '#EA2D2E', soft: 'rgba(234,45,46,0.08)', border: 'rgba(234,45,46,0.15)' }
  };
  const renderRuntimeCard = runtime => {
      const readmeUrl = `${repoUrl}/blob/main/${runtime.path}/README.md`;
      const codeUrl = `${repoUrl}/tree/main/${runtime.path}`;
      const statusLabel = runtime.enabled ? "Available" : "Planned";
      const colors = runtimeColors[runtime.id] ?? runtimeColors.typescript;
      const details = runtimeDetails[runtime.id] ?? {
        summary: "TPS runtime workspace.",
        chips: [],
        facts: [
          { label: "State", valueHtml: runtime.enabled ? "Active runtime." : "Planned runtime." },
          { label: "Workspace", valueHtml: `<code>${escapeHtml(runtime.path)}</code>` }
        ]
      };
      const chips = [
        `<span class="sdk-chip sdk-chip--status ${runtime.enabled ? 'sdk-chip--active' : 'sdk-chip--planned'}">${statusLabel}</span>`,
        `<span class="sdk-chip">${escapeHtml(runtime.language)}</span>`,
        ...details.chips.map(chip => `<span class="sdk-chip">${escapeHtml(chip)}</span>`),
        runtime.enabled ? `<span class="sdk-chip sdk-chip--ci">CI</span>` : "",
        runtime.coverage ? `<span class="sdk-chip sdk-chip--coverage">90%+ Coverage</span>` : ""
      ].filter(Boolean).join("");
      const facts = details.facts
        .map(fact => `<div class="sdk-fact"><dt>${escapeHtml(fact.label)}</dt><dd>${fact.valueHtml}</dd></div>`)
        .join("");
      return `<article class="sdk-card" id="sdk-${escapeHtml(runtime.id)}" style="--sdk-accent:${colors.accent};--sdk-soft:${colors.soft};--sdk-border:${colors.border}">
        <div class="sdk-card-head">
          <div class="sdk-icon">${runtimeIcons[runtime.id] ?? runtimeIcons.typescript}</div>
          <div class="sdk-card-title">
            <h3>${escapeHtml(runtime.language)}</h3>
            <p class="sdk-summary">${escapeHtml(details.summary)}</p>
          </div>
        </div>
        <div class="sdk-chips">${chips}</div>
        <dl class="sdk-facts">${facts}</dl>
        <div class="sdk-card-actions">
          <a class="button button-primary" href="${codeUrl}" target="_blank" rel="noopener">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="4 6 8 2 12 6"/><line x1="8" y1="2" x2="8" y2="11"/><path d="M3 10v2a2 2 0 002 2h6a2 2 0 002-2v-2"/></svg>
            View Code
          </a>
          <a class="button button-secondary" href="${readmeUrl}" target="_blank" rel="noopener">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M2 3h4l2 2h6v8H2V3z"/></svg>
            README
          </a>
        </div>
      </article>`;
    };
  const activeCards = activeRuntimes.map(renderRuntimeCard).join("");
  const plannedCards = plannedRuntimes.map(renderRuntimeCard).join("");
  const heroSignals = [
    `${activeCount} active runtimes with CI`,
    coverageCount > 0 ? `${coverageCount} runtimes with 90%+ coverage gates` : "Shared parity fixtures across all runtimes",
    plannedCount > 0 ? `${plannedCount} planned runtime workspaces reserved` : "All runtime slots are implemented today"
  ];
  const plannedSection = plannedCount > 0
    ? `
    <section class="answer-strip reveal" aria-labelledby="planned-sdks-title">
      <div class="answer-strip-header">
        <p class="panel-label">Planned SDKs</p>
        <h2 id="planned-sdks-title">Coming Next</h2>
      </div>
      <p class="sdk-section-copy">Reserved workspaces for future runtime implementations.</p>
      <div class="sdk-grid sdk-grid--planned">
        ${plannedCards}
      </div>
    </section>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>TPS SDKs — ManagedCode.Tps</title>
  <meta name="description" content="Browse the available TPS SDK runtimes, their status, and direct links to the implementation folders in the ManagedCode.Tps repository.">
  <meta name="robots" content="index, follow">
  <meta name="theme-color" content="#faf8f4">
  <link rel="canonical" href="${sdkUrl}">
  <meta property="og:title" content="TPS SDKs">
  <meta property="og:description" content="Available TPS SDK runtimes with links to code and README files.">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${sdkUrl}">
  <meta property="og:image" content="${socialImageUrl}">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="icon" href="../favicon.svg" type="image/svg+xml">
  <style>${css}</style>
</head>
<body>
  <nav class="top-nav scrolled">
    <div class="nav-inner">
      <a class="nav-logo" href="../">
        <svg width="24" height="24" viewBox="0 0 28 28" fill="none" aria-hidden="true"><rect width="28" height="28" rx="8" fill="url(#ng)"/><path d="M7 9h14M7 14h10M7 19h12" stroke="#faf8f4" stroke-width="2.2" stroke-linecap="round"/><defs><linearGradient id="ng" x1="0" y1="0" x2="28" y2="28"><stop stop-color="#8B7355"/><stop offset="1" stop-color="#C4A060"/></linearGradient></defs></svg>
        <span>TPS Format</span>
      </a>
      <div class="nav-links">
        <a href="../#specification">Spec</a>
        <a href="../examples/">Examples</a>
        <a href="../glossary/">Glossary</a>
        <a href="./">SDK</a>
        <a href="https://prompter.one" target="_blank" rel="noopener">Prompter One</a>
        <a class="nav-gh" href="${repoUrl}" target="_blank" rel="noopener">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>
          GitHub
        </a>
      </div>
    </div>
  </nav>

  <div class="page-shell">
    <header class="hero-copy">
      <span class="eyebrow">SDK Runtime Catalog</span>
      <p class="hero-kicker">ManagedCode.Tps</p>
      <h1 class="hero-title"><span class="hero-title-main">TPS SDKs</span></h1>
      <p class="hero-story">Every TPS SDK exposes the same contract: <em>constants</em>, <em>validation</em>, <em>parser</em>, <em>compiler</em>, and <em>player</em> APIs. Jump directly into the implementation code or check the <a href="../glossary/">glossary</a> for terminology.</p>
      <ul class="hero-signals">
        <li><svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><circle cx="8" cy="8" r="5" stroke="currentColor" stroke-width="1.6"/><path d="M6 8.5l1.5 1.5L10 7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>${escapeHtml(heroSignals[0])}</li>
        <li><svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><circle cx="8" cy="8" r="5" stroke="currentColor" stroke-width="1.6"/><path d="M8 5v3l2.5 1.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>${escapeHtml(heroSignals[1])}</li>
        <li><svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3 8h10M8 3v10" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>${escapeHtml(heroSignals[2])}</li>
      </ul>
      <div class="hero-actions">
        <a class="button button-primary" href="${repoUrl}/tree/main/SDK" target="_blank" rel="noopener">Browse SDK Workspace</a>
        <a class="button button-secondary" href="../">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M10 12L6 8l4-4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
          Back to Spec
        </a>
      </div>
      <div class="hero-facts">
        <span><strong>${activeCount}</strong> active SDKs</span>
        <span><strong>${plannedCount}</strong> planned SDKs</span>
        <span><strong>${coverageCount}</strong> coverage-gated runtimes</span>
        <span><strong>5</strong> API layers per runtime</span>
      </div>
    </header>

    <section class="answer-strip reveal" aria-labelledby="active-sdks-title">
      <div class="answer-strip-header">
        <p class="panel-label">Active SDKs</p>
        <h2 id="active-sdks-title">Implemented Today</h2>
      </div>
      <p class="sdk-section-copy">Production-ready runtimes with full CI, test suites, and coverage gating.</p>
      <div class="sdk-grid sdk-grid--active">
        ${activeCards}
      </div>
    </section>

    ${plannedSection}

    <footer class="site-footer">
      <span>Copyright &copy; <a href="https://www.managed-code.com/" target="_blank" rel="noopener">Managed Code</a></span>
      <span>Licensed under <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a></span>
      <span><a href="${repoUrl}">Repository</a></span>
    </footer>
  </div>

  <script>
  (function(){
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
    } else {
      reveals.forEach(function(el) { el.classList.add('revealed'); });
    }
  })();
  </script>
</body>
</html>`;
}

function buildGlossaryPage(glossaryContentHtml, css) {
  const glossaryUrl = `${siteUrl}glossary/`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>TPS Glossary — ManagedCode.Tps</title>
  <meta name="description" content="Glossary of TPS specification, compiler, player, and SDK terminology.">
  <meta name="robots" content="index, follow">
  <meta name="theme-color" content="#faf8f4">
  <link rel="canonical" href="${glossaryUrl}">
  <meta property="og:title" content="TPS Glossary">
  <meta property="og:description" content="Core TPS format and SDK terminology.">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${glossaryUrl}">
  <meta property="og:image" content="${socialImageUrl}">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="icon" href="../favicon.svg" type="image/svg+xml">
  <style>${css}</style>
</head>
<body>
  <nav class="top-nav scrolled">
    <div class="nav-inner">
      <a class="nav-logo" href="../">
        <svg width="24" height="24" viewBox="0 0 28 28" fill="none" aria-hidden="true"><rect width="28" height="28" rx="8" fill="url(#ng)"/><path d="M7 9h14M7 14h10M7 19h12" stroke="#faf8f4" stroke-width="2.2" stroke-linecap="round"/><defs><linearGradient id="ng" x1="0" y1="0" x2="28" y2="28"><stop stop-color="#8B7355"/><stop offset="1" stop-color="#C4A060"/></linearGradient></defs></svg>
        <span>TPS Format</span>
      </a>
      <div class="nav-links">
        <a href="../#specification">Spec</a>
        <a href="../examples/">Examples</a>
        <a href="./">Glossary</a>
        <a href="../sdk/">SDK</a>
        <a href="https://prompter.one" target="_blank" rel="noopener">Prompter One</a>
        <a class="nav-gh" href="${repoUrl}" target="_blank" rel="noopener">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>
          GitHub
        </a>
      </div>
    </div>
  </nav>

  <div class="example-page">
    <h1>TPS Glossary</h1>
    <p class="example-meta">
      <a href="../">&larr; Back to spec</a> &middot;
      Terminology reference for TPS format and SDK work.
    </p>
    <p class="example-desc">Use this page as the canonical term list for the TPS specification, compiler/runtime model, and the <code>ManagedCode.Tps</code> SDK workspace.</p>

    <article class="content-card">
      <div class="markdown-body">
        ${glossaryContentHtml}
      </div>
    </article>
  </div>

  <footer class="site-footer examples-index-footer">
    <span>Copyright &copy; <a href="https://www.managed-code.com/" target="_blank" rel="noopener">Managed Code</a></span>
    <span>Licensed under <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a></span>
    <span><a href="${repoUrl}">Repository</a></span>
  </footer>
</body>
</html>`;
}
