import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const src = fs.readFileSync(path.join(__dirname, 'maedaoshi-souzoku-v2.html'), 'utf8');

// Extract <style>...</style>
const styleMatch = src.match(/<style>([\s\S]*?)<\/style>/);
let css = styleMatch ? styleMatch[1] : '';

// Namespace all CSS selectors under .ms-wrap
// Simple approach: prefix every rule selector
css = css.replace(/(^|\})\s*([^{}@][^{}]*)\{/g, (m, brace, sel) => {
  // skip @media, @keyframes etc
  if (sel.trim().startsWith('@')) return m;
  // skip :root
  if (sel.includes(':root')) return brace + ' ' + sel + '{';
  const prefixed = sel.split(',').map(s => {
    s = s.trim();
    if (!s) return s;
    // body / html → .ms-wrap
    if (s === 'body' || s === 'html') return '.ms-wrap';
    if (s.startsWith('body ')) return '.ms-wrap ' + s.slice(5);
    return '.ms-wrap ' + s;
  }).join(', ');
  return brace + ' ' + prefixed + '{';
});

// Handle @media blocks – prefix inside
css = css.replace(/@media[^{]+\{([\s\S]*?)\n\}/g, (m) => {
  return m.replace(/(^|\})\s*([^{}@][^{}]*)\{/g, (mm, brace, sel) => {
    if (sel.trim().startsWith('@')) return mm;
    const prefixed = sel.split(',').map(s => {
      s = s.trim();
      if (!s) return s;
      if (s === 'body' || s === 'html') return '.ms-wrap';
      return '.ms-wrap ' + s;
    }).join(', ');
    return brace + ' ' + prefixed + '{';
  });
});

// Extract body content – only main sections (skip header, breadcrumb, footer, scripts)
const bodyMatch = src.match(/<body[^>]*>([\s\S]*?)<\/body>/);
let body = bodyMatch ? bodyMatch[1] : '';

// Remove header, breadcrumb, footer, script blocks
body = body
  .replace(/<header class="header">[\s\S]*?<\/header>/g, '')
  .replace(/<div class="breadcrumb">[\s\S]*?<\/div>/g, '')
  .replace(/<footer class="footer">[\s\S]*?<\/footer>/g, '')
  .replace(/<script>[\s\S]*?<\/script>/g, '')
  .replace(/<!--[\s\S]*?-->/g, '')
  .trim();

// fade-up を強制的に表示状態に（JS除去のため）
css += `
.ms-wrap .fade-up { opacity: 1 !important; transform: none !important; }
`;

const out = `<!-- ===== 前倒し相続ページ WordPress貼り付け用 ===== -->
<!-- 使い方: WordPress編集画面 → カスタムHTMLブロックを追加 → 以下を全てコピペ -->
<style>
${css}
</style>

<div class="ms-wrap">
${body}
</div>
`;

fs.writeFileSync(path.join(__dirname, 'maedaoshi-wp.html'), out);
console.log('Written:', 'maedaoshi-wp.html', `(${out.length} bytes)`);
