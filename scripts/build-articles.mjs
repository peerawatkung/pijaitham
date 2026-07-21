/**
 * สร้างหน้าบทความเป็น HTML static ลง dist/articles/<slug>/index.html
 * รันต่อท้าย `vite build` — หน้าเหล่านี้มี title/meta/JSON-LD ของตัวเอง
 * ให้ search engine เก็บเข้าดัชนีได้จริง (ต่างจากหน้าใน SPA ที่ meta ซ้ำกันหมด)
 *
 * หมายเหตุ: service worker ของแอปถูกตั้ง navigateFallbackDenylist ไว้ไม่ให้ทับ
 * เส้นทาง /articles — ดู vite.config.ts
 */
import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { ARTICLES } from '../src/content/articles.mjs'

const SITE = 'https://pijaitham.com'
const BRAND = 'พิใจธรรม'
const OUT_DIR = fileURLToPath(new URL('../dist/articles/', import.meta.url))

const esc = (s) =>
  s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')

const THAI_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
]

/** '2026-07-21' → '21 กรกฎาคม 2569' */
function thaiDate(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  return `${d} ${THAI_MONTHS[m - 1]} ${y + 543}`
}

/* โทนสีและฟอนต์ชุดเดียวกับแอป (src/index.css) — หน้า static ต้องรู้สึกเป็นเว็บเดียวกัน */
const STYLE = `
@font-face{font-family:'Sarabun';font-style:normal;font-weight:400;font-display:swap;src:url('/fonts/Sarabun-Regular.ttf') format('truetype')}
@font-face{font-family:'Sarabun';font-style:normal;font-weight:700;font-display:swap;src:url('/fonts/Sarabun-Bold.ttf') format('truetype')}
:root{--paper:#faf8f1;--card:#fffdf8;--tea-100:#eaf0e6;--tea-200:#d5e0cf;--tea-600:#5f7d61;--tea-700:#4c674f;--ink:#2e3a33;--ink-soft:#5a675f}
*{box-sizing:border-box;margin:0;padding:0}
html{font-size:17px}
body{background:var(--paper);color:var(--ink);font-family:'Sarabun',ui-sans-serif,system-ui,sans-serif;line-height:1.75}
.wrap{max-width:42rem;margin:0 auto;padding:1.5rem 1.25rem 3rem}
header.site a{display:inline-flex;align-items:center;gap:.5rem;font-weight:700;color:var(--tea-700);text-decoration:none;font-size:1.1rem}
header.site img{width:34px;height:34px}
h1{font-size:1.6rem;line-height:1.45;margin-top:1.5rem}
.meta{color:var(--ink-soft);font-size:.9rem;margin-top:.75rem}
.lead{color:var(--ink-soft);font-size:1.05rem;margin-top:1rem}
article h2{font-size:1.25rem;margin-top:2.25rem}
article p{margin-top:.9rem;font-size:1.05rem}
article ul{margin:.9rem 0 0 1.4rem}
article li{margin-top:.55rem;font-size:1.05rem}
.cta{margin-top:2.75rem;border:1px solid var(--tea-200);background:var(--tea-100);border-radius:.9rem;padding:1.4rem;text-align:center}
.cta p{font-size:1.05rem}
.cta a{display:inline-block;margin-top:.9rem;background:var(--tea-700);color:#fff;font-weight:700;text-decoration:none;border-radius:.75rem;padding:.85rem 2rem;font-size:1.1rem}
.cta a:hover{background:var(--tea-600)}
.cards{list-style:none;margin:1rem 0 0}
.cards li{border:1px solid var(--tea-200);background:var(--card);border-radius:.9rem;padding:1.1rem 1.25rem;margin-top:.75rem}
.cards a{color:var(--tea-700);font-weight:700;text-decoration:underline;text-decoration-color:var(--tea-200);text-underline-offset:4px;font-size:1.05rem}
.cards a:hover{text-decoration-color:var(--tea-600)}
.cards p{color:var(--ink-soft);font-size:.95rem;margin-top:.4rem}
.related h2{font-size:1.25rem;margin-top:2.75rem}
footer.site{margin-top:3rem;border-top:1px solid var(--tea-200);padding-top:1.25rem;color:var(--ink-soft);font-size:.9rem;text-align:center}
footer.site a{color:var(--ink-soft)}
`.trim()

const CTA = `
<div class="cta">
  <p><strong>เขียนหนังสือแสดงเจตนาของคุณเองได้ฟรี</strong><br>
  ตอบคำถามทีละข้อ ได้เอกสารพร้อมพิมพ์ตามมาตรา 12 — ไม่เก็บข้อมูลใด ๆ ของคุณ</p>
  <a href="/">เริ่มเขียนที่พิใจธรรม</a>
</div>`

function pageShell({ title, description, canonical, body, jsonLd }) {
  return `<!doctype html>
<html lang="th">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)} — ${BRAND}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${canonical}">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<meta property="og:site_name" content="${BRAND}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:type" content="article">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${SITE}/og-image.jpg">
<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
<style>${STYLE}</style>
</head>
<body>
<div class="wrap">
<header class="site"><a href="/"><img src="/logo.png" alt="" width="34" height="34">${BRAND}</a></header>
${body}
<footer class="site">
<p>${BRAND} · <a href="/">pijaitham.com</a> — เครื่องมือเขียนหนังสือแสดงเจตนา ฟรี ไม่เก็บข้อมูล</p>
<p>บทความนี้เป็นข้อมูลทั่วไป ไม่ใช่คำแนะนำทางการแพทย์หรือกฎหมาย</p>
</footer>
</div>
</body>
</html>
`
}

function sectionHtml(section) {
  const parts = []
  if (section.heading) parts.push(`<h2>${esc(section.heading)}</h2>`)
  for (const p of section.paragraphs ?? []) parts.push(`<p>${esc(p)}</p>`)
  if (section.items?.length) {
    parts.push(
      `<ul>${section.items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`,
    )
  }
  return parts.join('\n')
}

function articlePage(article) {
  const canonical = `${SITE}/articles/${article.slug}/`
  const related = ARTICLES.filter((a) => a.slug !== article.slug)
  const body = `
<article>
<h1>${esc(article.title)}</h1>
<p class="meta">เผยแพร่ ${thaiDate(article.published)} · โดย ${BRAND}</p>
${article.sections.map(sectionHtml).join('\n')}
</article>
${CTA}
<section class="related">
<h2>บทความอื่น</h2>
<ul class="cards">
${related
  .map(
    (a) =>
      `<li><a href="/articles/${a.slug}/">${esc(a.title)}</a><p>${esc(a.description)}</p></li>`,
  )
  .join('\n')}
</ul>
</section>`
  return pageShell({
    title: article.title,
    description: article.description,
    canonical,
    body,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: article.title,
      description: article.description,
      datePublished: article.published,
      inLanguage: 'th',
      mainEntityOfPage: canonical,
      author: { '@type': 'Organization', name: BRAND, url: SITE },
      publisher: { '@type': 'Organization', name: BRAND, url: SITE },
    },
  })
}

function hubPage() {
  const body = `
<h1>บทความ</h1>
<p class="lead">ความรู้เรื่องการวางแผนดูแลชีวิตช่วงท้าย เขียนด้วยภาษาที่คุยกันในบ้านได้ — อ่านก่อน แล้วค่อยตัดสินใจในแบบของคุณ</p>
<ul class="cards">
${ARTICLES.map(
  (a) =>
    `<li><a href="/articles/${a.slug}/">${esc(a.title)}</a><p>${esc(a.description)}</p></li>`,
).join('\n')}
</ul>
${CTA}`
  return pageShell({
    title: 'บทความ — ความรู้เรื่องการวางแผนชีวิตช่วงท้าย',
    description:
      'รวมบทความเรื่องหนังสือแสดงเจตนา (Living Will) มาตรา 12 การดูแลแบบประคับประคอง และการชวนครอบครัวคุยเรื่องช่วงท้ายของชีวิต — อ่านง่าย อิงกฎหมายไทย',
    canonical: `${SITE}/articles/`,
    body,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: `บทความ — ${BRAND}`,
      inLanguage: 'th',
      url: `${SITE}/articles/`,
    },
  })
}

await mkdir(OUT_DIR, { recursive: true })
await writeFile(`${OUT_DIR}index.html`, hubPage())
for (const article of ARTICLES) {
  const dir = `${OUT_DIR}${article.slug}/`
  await mkdir(dir, { recursive: true })
  await writeFile(`${dir}index.html`, articlePage(article))
}
console.log(`articles: built ${ARTICLES.length} pages + hub → dist/articles/`)
