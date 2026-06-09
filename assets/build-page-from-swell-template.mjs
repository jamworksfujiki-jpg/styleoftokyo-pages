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

function buildJsonLd({ title, description, slug, h1, ogImage, datePublished, dateModified, pageType, breadcrumb, faq, keywords }) {
  const pageUrl = `https://styleoftokyo.jp/${slug}/`;
  const graph = [
    {
      '@type': 'Organization',
      '@id': 'https://styleoftokyo.jp/#organization',
      name: 'スタイルオブ東京',
      url: 'https://styleoftokyo.jp/',
      logo: {
        '@type': 'ImageObject',
        url: 'https://styleoftokyo.jp/wp-content/uploads/2023/01/logo.png',
        width: 1000,
        height: 214,
      },
    },
    {
      '@type': 'WebSite',
      '@id': 'https://styleoftokyo.jp/#website',
      url: 'https://styleoftokyo.jp/',
      name: 'スタイルオブ東京 | 不動産・建築会社・住宅ローン・不動産売買に必要なすべてをベストな形で提供する動産エージェント',
      description: 'スタイルオブ東京は、不動産の購入・売却・住み替え・相続・空き家・建築リフォームまで、あらゆる不動産のお悩みに中立の立場で対応する東京の不動産エージェント会社です。Zoom無料相談受付中。',
      publisher: { '@id': 'https://styleoftokyo.jp/#organization' },
      inLanguage: 'ja',
    },
    {
      '@type': pageType,
      '@id': pageUrl,
      url: pageUrl,
      name: title,
      description,
      isPartOf: { '@id': 'https://styleoftokyo.jp/#website' },
      about: { '@id': 'https://styleoftokyo.jp/#organization' },
      primaryImageOfPage: {
        '@type': 'ImageObject',
        url: ogImage,
      },
      datePublished,
      dateModified,
      inLanguage: 'ja',
      breadcrumb: { '@id': `${pageUrl}#breadcrumb` },
      ...(keywords ? { keywords } : {}),
    },
    {
      '@type': 'BreadcrumbList',
      '@id': `${pageUrl}#breadcrumb`,
      itemListElement: breadcrumb.map((b, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: b.name,
        item: b.url,
      })),
    },
  ];

  if (faq && faq.length) {
    graph.push({
      '@type': 'FAQPage',
      '@id': `${pageUrl}#faq`,
      mainEntity: faq.map((q) => ({
        '@type': 'Question',
        name: q.q,
        acceptedAnswer: { '@type': 'Answer', text: q.a },
      })),
    });
  }

  return JSON.stringify({ '@context': 'https://schema.org', '@graph': graph });
}

function buildPage({ title, description, slug, h1, bodyHtml, ogImage, datePublished, dateModified, pageType, breadcrumb, faq, keywords }) {
  let tpl = fs.readFileSync(templatePath, 'utf8');
  ogImage = ogImage || 'https://styleoftokyo.jp/wp-content/uploads/2023/02/ogp-1.jpg';

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

  // 4. og:title / og:description / og:url / og:image
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
  tpl = tpl.replace(
    /<meta\s+property="og:image"\s+content="[^"]*"\s*\/?>/g,
    `<meta property="og:image" content="${ogImage}" />`
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

  // 6b. og:image:alt / og:image:width / og:image:height / twitter:image を canonical の直後に挿入（未設定なら）
  const extraMeta = [
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta property="og:image:alt" content="${title}" />`,
    `<meta name="twitter:image" content="${ogImage}" />`,
    `<meta name="twitter:title" content="${title}" />`,
    `<meta name="twitter:description" content="${description}" />`,
    keywords ? `<meta name="keywords" content="${keywords}" />` : '',
  ].filter(Boolean).join('\n');
  if (!/<meta\s+name="twitter:image"/.test(tpl)) {
    tpl = tpl.replace(
      /<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/,
      (m) => `${m}\n${extraMeta}`
    );
  }

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

  // 11. 末尾の JSON-LD を、このページ用の正しい構造化データに差し替え
  const newJsonLd = buildJsonLd({
    title, description, slug, h1, ogImage,
    datePublished, dateModified, pageType, breadcrumb, faq, keywords,
  });
  tpl = tpl.replace(
    /<script\s+type="application\/ld\+json">[\s\S]*?<\/script>/,
    `<script type="application/ld+json">${newJsonLd}</script>`
  );

  return tpl;
}

const PUBLISHED = '2026-06-08T15:00:00+09:00';
const MODIFIED = new Date().toISOString().replace(/\.\d+Z$/, '+00:00');

// --- CONCEPT ページの生成 ---
const conceptSrc = fs.readFileSync(conceptSrcPath, 'utf8');
const conceptBody = extractSubpageDiv(conceptSrc, 'sot-concept-page');
const conceptFaq = [
  { q: 'スタイルオブ東京はどんな会社ですか？', a: '東京の不動産エージェント会社です。物件を「売る」のではなく、お客様の代理人として、不動産の購入・売却・住み替え・相続・空き家・建築リフォームまで、暮らし全体から逆算してサポートします。中立な立場で、住宅会社や金融機関とも横並びで関わります。' },
  { q: '普通の不動産会社と何が違うのですか？', a: '私たちは売主側ではなく、お客様側に立つ代理人です。物件のおすすめではなく、お客様が言葉にしていない暮らしの優先順位を整理し、そこから物件・住宅会社・ローンを横断して比較・交渉します。仲介手数料の範囲で、契約書に載らない細かな調査・通訳・調整まで行います。' },
  { q: 'どんな相談ができますか？', a: '土地探し、戸建ての購入、マンション購入、住み替え、相続、空き家、建築会社選び、リフォーム、住宅ローンの組み方など、不動産にまつわるご相談を幅広くお受けしています。「買う・買わない」が決まっていない段階のご相談も歓迎です。' },
  { q: '相談は有料ですか？', a: 'ご相談自体は無料です。最終的にご契約に至った場合のみ、法定の仲介手数料を頂戴します。物件調査・住宅会社との連携・専門用語の通訳など、契約書に書かれていない細かな仕事も、すべて仲介手数料の範囲で対応します。' },
  { q: 'Zoomやオンラインでも相談できますか？', a: 'はい。Zoomでの無料相談を受け付けています。遠方の方や、日中はお時間が取りにくい方も、まずはオンラインで暮らしの構想や気になる物件についてお話しください。お問い合わせフォームまたはLINEからご予約いただけます。' },
];
const conceptHtml = buildPage({
  title: 'スタイルオブ東京とは｜中立な不動産エージェント・東京で土地探し/住み替え/相続の代理人',
  description: '東京で土地探し・住み替え・相続・空き家まで、お客様の代理人として中立に伴走する不動産エージェント。物件のセカンドオピニオン、住宅会社・住宅ローンの横断比較も仲介手数料の範囲で対応。Zoom無料相談受付中。',
  slug: 'concept',
  h1: 'スタイルオブ東京とは',
  bodyHtml: conceptBody,
  ogImage: 'https://styleoftokyo.jp/concept/assets/concept-banner.png',
  datePublished: PUBLISHED,
  dateModified: MODIFIED,
  pageType: 'AboutPage',
  keywords: 'スタイルオブ東京,中立な不動産エージェント,代理人,セカンドオピニオン,東京,土地探し,住み替え,相続,空き家,住宅ローン相談',
  breadcrumb: [
    { name: 'ホーム', url: 'https://styleoftokyo.jp/' },
    { name: 'スタイルオブ東京とは', url: 'https://styleoftokyo.jp/concept/' },
  ],
  faq: conceptFaq,
});
const conceptOutDir = path.join(root, 'concept');
fs.mkdirSync(conceptOutDir, { recursive: true });
fs.writeFileSync(path.join(conceptOutDir, 'index.html'), conceptHtml);
console.log(`✓ concept/index.html written (${conceptHtml.length.toLocaleString()} bytes)`);

// --- PARTNERS ページの生成 ---
const partnersSrc = fs.readFileSync(partnersSrcPath, 'utf8');
const partnersBody = extractSubpageDiv(partnersSrc, 'sot-partners-page');
const partnersFaq = [
  { q: '本当に仲介手数料以外、追加料金はかからないのですか？', a: 'はい。物件調査も、住宅会社との連携も、専門用語の通訳も、すべて仲介手数料の範囲で対応します。何件見ても、最終的に見送ることになっても、料金は変わりません。' },
  { q: 'いろんな会社に問い合わせると営業の連絡が増えるのが心配です', a: '私たちにご相談いただければ、気になる物件のURLを送るだけで、こちらでまとめて調査・お問い合わせまで行います。私たち自身からの営業のご連絡もいたしません。' },
  { q: 'SUUMOで気になった土地があるのですが、相談できますか？', a: 'もちろんです。気になる土地のURLを送っていただければ、まず机上で調査して、私たちのコメントをお返しします。買う・買わないが決まっていなくて結構です。' },
  { q: '住宅会社はまだ決まっていません。それでも相談できますか？', a: '大丈夫です。お話を伺いながら、お客様に合いそうな住宅会社のご紹介もできます。中立な立場で、複数のご提案からお選びいただけます。' },
  { q: '途中で辞めることはできますか？', a: 'いつでも辞めていただけます。私たちは契約の縛りを設けません。ご納得いただけない判断は、ぜひお伝えください。' },
];
const partnersHtml = buildPage({
  title: '住宅会社からのご紹介の方へ｜東京の土地探し・物件調査の代理人サービス | STYLE OF TOKYO',
  description: '住宅会社からのご紹介でお越しいただいた方の専用ページ。東京で土地探し・物件調査・住宅会社との連携・住宅ローン相談まで、お客様の専属パートナーとして竣工まで伴走する不動産エージェント。仲介手数料以外の追加料金は一切なし。',
  slug: 'partners',
  h1: '住宅会社からのご紹介の方へ',
  bodyHtml: partnersBody,
  ogImage: 'https://styleoftokyo.jp/partners/assets/partners-banner.png',
  datePublished: PUBLISHED,
  dateModified: MODIFIED,
  pageType: 'WebPage',
  keywords: '住宅会社 提携,工務店 土地探し,東京 土地探し 代理人,専属パートナー,物件調査,住宅ローン相談,不動産エージェント',
  breadcrumb: [
    { name: 'ホーム', url: 'https://styleoftokyo.jp/' },
    { name: '住宅会社からのご紹介の方へ', url: 'https://styleoftokyo.jp/partners/' },
  ],
  faq: partnersFaq,
});
const partnersOutDir = path.join(root, 'partners');
fs.mkdirSync(partnersOutDir, { recursive: true });
fs.writeFileSync(path.join(partnersOutDir, 'index.html'), partnersHtml);
console.log(`✓ partners/index.html written (${partnersHtml.length.toLocaleString()} bytes)`);
