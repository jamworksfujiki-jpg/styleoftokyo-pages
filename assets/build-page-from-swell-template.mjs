// Build /concept/index.html and /partners/index.html
// using the SWELL-rendered zeirishi-recruit/index.html as a template.
//
// Strategy: Replace the body content (.sot-subpage) and metadata
// (title, description, og:*, breadcrumb, h1) only — keep all SWELL
// header/footer markup, scripts, and CSS intact.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const templatePath = path.join(root, '_seo-aio-preview', 'zeirishi-live.html');
const conceptSrcPath = path.join(root, 'concept.html');
const partnersSrcPath = path.join(root, 'partners.html');

function extractSubpageDiv(html, className) {
  // 単純な解析: <div class="sot-subpage sot-XXXX-page"> から対応する </div> まで
  const startMarker = `<div class="sot-subpage ${className}">`;
  const start = html.indexOf(startMarker);
  if (start === -1) throw new Error(`Not found: ${startMarker}`);

  // 対応するdivを見つけるため、depth counter
  let depth = 0;
  let i = start;
  while (i < html.length) {
    if (html.startsWith('<div', i)) {
      depth++;
      i += 4;
    } else if (html.startsWith('</div>', i)) {
      depth--;
      if (depth === 0) {
        return html.slice(start, i + 6);
      }
      i += 6;
    } else {
      i++;
    }
  }
  throw new Error(`Unclosed div: ${startMarker}`);
}

function buildPage({ title, description, slug, h1, bodyHtml }) {
  let tpl = fs.readFileSync(templatePath, 'utf8');

  // 1. テンプレート内の zeirishi 本文 div を新しい本文に置換
  const oldBody = extractSubpageDiv(tpl, 'sot-zeirishi-recruit');
  tpl = tpl.replace(oldBody, bodyHtml);

  // 2. <title>
  tpl = tpl.replace(
    /<title>[\s\S]*?<\/title>/,
    `<title>${title}</title>`
  );

  // 3. <meta name="description" ...>
  tpl = tpl.replace(
    /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/g,
    `<meta name="description" content="${description}" />`
  );

  // 4. og:title / og:description / og:url
  tpl = tpl.replace(
    /<meta\s+property="og:title"\s+content="[^"]*"\s*\/?>/g,
    `<meta property="og:title" content="${title}" />`
  );
  tpl = tpl.replace(
    /<meta\s+property="og:description"\s+content="[^"]*"\s*\/?>/g,
    `<meta property="og:description" content="${description}" />`
  );
  tpl = tpl.replace(
    /<meta\s+property="og:url"\s+content="[^"]*"\s*\/?>/g,
    `<meta property="og:url" content="https://styleoftokyo.jp/${slug}/" />`
  );

  // 5. canonical
  tpl = tpl.replace(
    /<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/g,
    `<link rel="canonical" href="https://styleoftokyo.jp/${slug}/" />`
  );

  // 6. twitter:title / twitter:description
  tpl = tpl.replace(
    /<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/?>/g,
    `<meta name="twitter:title" content="${title}" />`
  );
  tpl = tpl.replace(
    /<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/?>/g,
    `<meta name="twitter:description" content="${description}" />`
  );

  // 7. h1 c-pageTitle（CSS で非表示にしてるので念の為）
  tpl = tpl.replace(
    /<h1 class="c-pageTitle">[^<]*<\/h1>/,
    `<h1 class="c-pageTitle">${h1}</h1>`
  );

  // 8. breadcrumb の現在ページ名
  tpl = tpl.replace(
    /<span class="p-breadcrumb__text">提携会計事務所募集<\/span>/g,
    `<span class="p-breadcrumb__text">${h1}</span>`
  );

  // 9. body class の page-id-6484 を消す（特定IDに紐づくJSが暴発しないように）
  tpl = tpl.replace(/page-id-6484/g, 'page-id-custom');
  tpl = tpl.replace(/id_6484/g, 'id_custom');

  // 10. data-postid="6484" を空に
  tpl = tpl.replace(/data-postid="6484"/g, 'data-postid=""');

  return tpl;
}

// --- CONCEPT ページの生成 ---
const conceptSrc = fs.readFileSync(conceptSrcPath, 'utf8');
const conceptBody = extractSubpageDiv(conceptSrc, 'sot-concept-page');
const conceptHtml = buildPage({
  title: 'スタイルオブ東京とは | STYLE OF TOKYO',
  description: '不動産を買うことが、ゴールではない。楽しく暮らして初めて、いい物件を買ったことになる。スタイルオブ東京のコンセプトをご紹介します。',
  slug: 'concept',
  h1: 'スタイルオブ東京とは',
  bodyHtml: conceptBody,
});
const conceptOutDir = path.join(root, 'concept');
fs.mkdirSync(conceptOutDir, { recursive: true });
fs.writeFileSync(path.join(conceptOutDir, 'index.html'), conceptHtml);
console.log(`✓ concept/index.html written (${conceptHtml.length.toLocaleString()} bytes)`);

// --- PARTNERS ページの生成 ---
const partnersSrc = fs.readFileSync(partnersSrcPath, 'utf8');
const partnersBody = extractSubpageDiv(partnersSrc, 'sot-partners-page');
const partnersHtml = buildPage({
  title: '住宅会社からのご紹介の方へ | わたしたちの仕事 | STYLE OF TOKYO',
  description: '住宅会社からのご紹介でお越しいただいた方へ。土地探しのプロが、お住まいの竣工まで専属パートナーとして伴走します。',
  slug: 'partners',
  h1: '住宅会社からのご紹介の方へ',
  bodyHtml: partnersBody,
});
const partnersOutDir = path.join(root, 'partners');
fs.mkdirSync(partnersOutDir, { recursive: true });
fs.writeFileSync(path.join(partnersOutDir, 'index.html'), partnersHtml);
console.log(`✓ partners/index.html written (${partnersHtml.length.toLocaleString()} bytes)`);
