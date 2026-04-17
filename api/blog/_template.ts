/**
 * Blog post template + helpers.
 *
 * Renders a published post in the exact same layout as the hand-written
 * articles under /client/public/blog so visitors can't tell the difference.
 */

export interface PostInput {
  title: string;
  slug: string;
  description: string; // used for meta description / excerpt / OG
  tag: string;         // e.g. "Room Planning"
  /**
   * Article body. Can be either:
   *   • A full HTML fragment (`<h2>…</h2><p>…</p>`), OR
   *   • Plain markdown-ish / text — we'll wrap paragraphs automatically.
   */
  body: string;
  readingTime?: string; // e.g. "8 min read"
  datePublished?: string; // ISO yyyy-mm-dd
  canonicalUrl?: string;  // defaults to https://freeroomplanner.com/blog/<slug>
  ogImage?: string;
}

const SITE = "https://freeroomplanner.com";

export function escapeHtml(str: string): string {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttr(str: string): string {
  return escapeHtml(str);
}

/**
 * Escape a value for safe inclusion inside a <script type="application/ld+json">
 * block. We JSON.stringify, then neutralise any `</script` sequence (which
 * would otherwise close the script tag early and allow XSS).
 */
function jsonForScript(value: unknown): string {
  return JSON.stringify(value).replace(/<\/script/gi, "<\\/script");
}

/** Rough word count based on text inside HTML. */
export function estimateReadingTime(html: string): string {
  const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const words = text ? text.split(" ").length : 0;
  const minutes = Math.max(1, Math.round(words / 220));
  return `${minutes} min read`;
}

/**
 * Strip tags and attributes that should never appear in article bodies,
 * regardless of how trusted the caller is. This is a best-effort scrub —
 * the endpoint is already auth-gated, but defence-in-depth matters.
 */
function sanitiseBodyHtml(html: string): string {
  return html
    // Remove entire <script>, <style>, <iframe>, <object>, <embed> blocks
    .replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, "")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style\s*>/gi, "")
    .replace(/<iframe\b[^>]*>[\s\S]*?<\/iframe\s*>/gi, "")
    .replace(/<object\b[^>]*>[\s\S]*?<\/object\s*>/gi, "")
    .replace(/<embed\b[^>]*\/?>/gi, "")
    // Remove inline event handlers (onclick="…", onerror='…', etc.)
    .replace(/\s+on[a-z]+\s*=\s*"[^"]*"/gi, "")
    .replace(/\s+on[a-z]+\s*=\s*'[^']*'/gi, "")
    .replace(/\s+on[a-z]+\s*=\s*[^\s>]+/gi, "")
    // Neutralise javascript: URLs in href/src attributes
    .replace(/(\s(?:href|src|action|formaction)\s*=\s*)(["'])\s*javascript:[^"']*\2/gi, "$1$2#$2");
}

/**
 * If the body already looks like HTML (contains a block tag), leave it alone.
 * Otherwise wrap double-newline-separated paragraphs in <p> tags.
 */
export function normaliseBody(body: string): string {
  const trimmed = body.trim();
  const looksLikeHtml = /<(h[1-6]|p|ul|ol|blockquote|section|article|div|table)\b/i.test(trimmed);
  const wrapped = looksLikeHtml
    ? trimmed
    : trimmed
        .split(/\n{2,}/)
        .map((p) => `<p>${p.trim().replace(/\n/g, "<br/>")}</p>`)
        .join("\n");
  return sanitiseBodyHtml(wrapped);
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || `post-${Date.now()}`;
}

export function titleFromSlug(slug: string): string {
  return slug
    .split("-")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

/** Build the full HTML document for a blog post. */
export function renderPostHtml(input: PostInput): string {
  const title = input.title;
  const slug = input.slug;
  const desc = input.description;
  const tag = input.tag || "Room Planning";
  const body = normaliseBody(input.body);
  const readingTime = input.readingTime || estimateReadingTime(body);
  const datePublished = input.datePublished || new Date().toISOString().slice(0, 10);
  const canonical = input.canonicalUrl || `${SITE}/blog/${slug}`;
  const ogImage = input.ogImage || `${SITE}/og-image.png`;

  const fullTitle = `${title} | Free Room Planner`;
  const breadcrumbName = title.length > 60 ? title.slice(0, 57) + "…" : title;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<!-- Ahrefs Analytics -->
<script src="https://analytics.ahrefs.com/analytics.js" data-key="MsX/2VW6nY/D19aSN0t29Q" async></script>
<meta name="author" content="Free Room Planner">
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(fullTitle)}</title>
<meta name="description" content="${escapeAttr(desc)}">
<link rel="canonical" href="${escapeAttr(canonical)}">
<meta property="og:type" content="article">
<meta property="og:site_name" content="Free Room Planner">
<meta property="og:title" content="${escapeAttr(title)}">
<meta property="og:description" content="${escapeAttr(desc)}">
<meta property="og:url" content="${escapeAttr(canonical)}">
<meta property="og:image" content="${escapeAttr(ogImage)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escapeAttr(title)}">
<meta name="twitter:description" content="${escapeAttr(desc)}">
<meta name="twitter:image" content="${escapeAttr(ogImage)}">
<link rel="icon" type="image/x-icon" href="/favicon.ico">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<meta name="theme-color" content="#0d9488">
<link rel="preconnect" href="https://api.fontshare.com">
<link rel="preload" as="style" href="https://api.fontshare.com/v2/css?f[]=general-sans@400,500,600,700&display=swap">
<link href="https://api.fontshare.com/v2/css?f[]=general-sans@400,500,600,700&display=swap" rel="stylesheet" media="print" onload="this.media='all'">
<noscript><link href="https://api.fontshare.com/v2/css?f[]=general-sans@400,500,600,700&display=swap" rel="stylesheet"></noscript>
<link rel="stylesheet" href="/rs.css">
</head>
<body>
<header class="site-header">
  <div class="container">
    <nav class="site-nav">
      <a href="/" class="nav-logo"><svg width="24" height="24" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Free Room Planner" style="color:var(--accent)"><rect x="3" y="3" width="26" height="26" rx="2" stroke="currentColor" stroke-width="2.5" fill="none"/><line x1="3" y1="14" x2="20" y2="14" stroke="currentColor" stroke-width="2"/><line x1="20" y1="14" x2="20" y2="29" stroke="currentColor" stroke-width="2"/><path d="M 22 14 A 5 5 0 0 1 27 14" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round"/><line x1="8" y1="7" x2="15" y2="7" stroke="currentColor" stroke-width="1" stroke-dasharray="1.5 1" opacity="0.5"/><line x1="8" y1="6" x2="8" y2="8" stroke="currentColor" stroke-width="1" opacity="0.5"/><line x1="15" y1="6" x2="15" y2="8" stroke="currentColor" stroke-width="1" opacity="0.5"/></svg> Free Room Planner</a>
      <ul class="nav-links" id="nav-links">
        <li><a href="/how-it-works">How it works</a></li>
        <li><a href="/#features">Features</a></li>
        <li><a href="/#faq">FAQ</a></li>
        <li><a href="/get-embed">For businesses</a></li>
      </ul>
      <div class="nav-actions">
        <button class="btn-ghost" id="theme-toggle" aria-label="Toggle dark mode" title="Toggle dark mode"><svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg><svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg></button>
        <button class="btn-ghost nav-mobile-toggle" id="mobile-nav-toggle" aria-label="Menu"><svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg></button>
        <a href="/app" class="btn btn-primary btn-sm" style="text-decoration:none">Start planning</a>
      </div>
    </nav>
  </div>
</header>
<style>
  #theme-toggle svg:last-child { display:none; }
  .dark #theme-toggle svg:first-child { display:none; }
  .dark #theme-toggle svg:last-child { display:block; }
</style>

<nav class="breadcrumb container" aria-label="Breadcrumb">
  <a href="/">Home</a><span>/</span><a href="/blog">Blog</a><span>/</span><span>${escapeHtml(breadcrumbName)}</span>
</nav>

<article itemscope itemtype="https://schema.org/BlogPosting">
<section class="hero" style="padding-bottom:var(--space-8);text-align:left">
  <div class="container--narrow">
    <div class="hero__eyebrow" style="text-align:left"><span class="badge">${escapeHtml(tag)}</span></div>
    <h1 class="hero__title" style="font-size:var(--text-2xl);text-align:left" itemprop="headline">${escapeHtml(title)}</h1>
    <div style="display:flex;gap:var(--space-4);align-items:center;flex-wrap:wrap;margin-top:var(--space-4)">
      <span class="text-muted" style="font-size:var(--text-sm)">${escapeHtml(readingTime)}</span>
      <a href="/app" class="btn btn-primary btn-sm" style="margin-left:auto">Try Free Room Planner free</a>
    </div>
  </div>
</section>

<section class="section" style="padding-top:0">
  <div class="container--narrow">
    <div class="prose fade-in" itemprop="articleBody">
${body}
    </div>
    <div style="margin-top:var(--space-12);padding:var(--space-6);background:var(--accent-bg);border-radius:var(--radius-lg);text-align:center" class="fade-in">
      <p style="font-weight:600;margin-bottom:var(--space-3)">Draw your own floor plan — free</p>
      <p style="color:var(--fg-muted);font-size:var(--text-sm);margin-bottom:var(--space-5)">Free Room Planner is a free browser-based room planner. No account, no download — open it and start drawing.</p>
      <a href="/app" class="btn btn-primary">Open Free Room Planner free</a>
    </div>
  </div>
</section>
</article>

<section class="cta-section">
  <div class="container fade-in">
    <h2 class="section__title">Ready to plan your room?</h2>
    <p class="section__sub" style="margin:var(--space-4) auto var(--space-8)">Free. No account. Works in your browser.</p>
    <a href="/app" class="btn btn-primary btn-lg">Start planning free</a>
  </div>
</section>

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": ${jsonForScript(title)},
  "description": ${jsonForScript(desc)},
  "datePublished": ${jsonForScript(datePublished)},
  "dateModified": ${jsonForScript(datePublished)},
  "image": ${jsonForScript(ogImage)},
  "keywords": ${jsonForScript(tag)},
  "url": ${jsonForScript(canonical)},
  "author": {"@type": "Organization", "name": "Free Room Planner", "url": "https://freeroomplanner.com"},
  "publisher": {"@type":"Organization","name":"Free Room Planner","url":"https://freeroomplanner.com","logo":{"@type":"ImageObject","url":"https://freeroomplanner.com/og-image.png"}}
}
</script>

<script type="application/ld+json">{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {"@type": "ListItem", "position": 1, "name": "Home", "item": "https://freeroomplanner.com/"},
    {"@type": "ListItem", "position": 2, "name": "Blog", "item": "https://freeroomplanner.com/blog"},
    {"@type": "ListItem", "position": 3, "name": ${jsonForScript(title)}}
  ]
}</script>

<footer class="site-footer">
  <div class="container">
    <div class="footer-grid">
      <div class="footer-brand">
        <div class="footer-brand__logo"><svg width="24" height="24" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Free Room Planner" style="color:var(--accent)"><rect x="3" y="3" width="26" height="26" rx="2" stroke="currentColor" stroke-width="2.5" fill="none"/><line x1="3" y1="14" x2="20" y2="14" stroke="currentColor" stroke-width="2"/><line x1="20" y1="14" x2="20" y2="29" stroke="currentColor" stroke-width="2"/><path d="M 22 14 A 5 5 0 0 1 27 14" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round"/><line x1="8" y1="7" x2="15" y2="7" stroke="currentColor" stroke-width="1" stroke-dasharray="1.5 1" opacity="0.5"/><line x1="8" y1="6" x2="8" y2="8" stroke="currentColor" stroke-width="1" opacity="0.5"/><line x1="15" y1="6" x2="15" y2="8" stroke="currentColor" stroke-width="1" opacity="0.5"/></svg> Free Room Planner</div>
        <p>Free browser-based room planner for homeowners. Draw accurate floor plans in minutes — no account, no download required.</p>
      </div>
      <div class="footer-col">
        <p class="footer-col__title">Planners</p>
        <ul>
          <li><a href="/room-planner">Room Planner</a></li>
          <li><a href="/kitchen-planner">Kitchen Planner</a></li>
          <li><a href="/bathroom-planner">Bathroom Planner</a></li>
          <li><a href="/bedroom-planner">Bedroom Planner</a></li>
          <li><a href="/living-room-planner">Living Room Planner</a></li>
          <li><a href="/floor-plan-maker">Floor Plan Maker</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <p class="footer-col__title">Resources</p>
        <ul>
          <li><a href="/how-it-works">How it works</a></li>
          <li><a href="/blog">Blog</a></li>
          <li><a href="/app">Open the planner</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <p class="footer-col__title">Use cases</p>
        <ul>
          <li><a href="/kitchen-planner">Kitchen renovations</a></li>
          <li><a href="/bathroom-planner">Bathroom refits</a></li>
          <li><a href="/bedroom-planner">Room rearrangements</a></li>
          <li><a href="/living-room-planner">Living room layouts</a></li>
          <li><a href="/floor-plan-maker">Floor plans &amp; renovations</a></li>
          <li><a href="/room-planner">Extensions &amp; new builds</a></li>
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      <span>&copy; 2026 Free Room Planner. Free to use.</span>
      <a href="https://www.perplexity.ai/computer" target="_blank" rel="noopener noreferrer">Created with Perplexity Computer</a>
    </div>
  </div>
</footer>
<script src="/rs.js" defer></script>
</body>
</html>`;
}

/** Build the post-card HTML that gets inserted into the blog index. */
export function renderPostCard(input: {
  title: string;
  slug: string;
  description: string;
  tag: string;
  readingTime: string;
}): string {
  return `<article class="post-card fade-in" style="transition-delay:0ms" itemscope itemtype="https://schema.org/BlogPosting">
  <div class="post-card__body">
    <div class="post-card__tag" itemprop="keywords">${escapeHtml(input.tag)}</div>
    <h2 class="post-card__title" itemprop="headline"><a href="/blog/${escapeAttr(input.slug)}">${escapeHtml(input.title)}</a></h2>
    <p class="post-card__excerpt" itemprop="description">${escapeHtml(input.description)}</p>
    <div class="post-card__meta">${escapeHtml(input.readingTime)}</div>
  </div>
</article>`;
}

/** Build the sitemap <url> entry. */
export function renderSitemapEntry(slug: string, lastmod: string): string {
  return `  <url><loc>https://freeroomplanner.com/blog/${slug}</loc><lastmod>${lastmod}</lastmod><changefreq>monthly</changefreq><priority>0.7</priority></url>`;
}
