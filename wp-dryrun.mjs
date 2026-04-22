// Dry-run: verify each edit's `find` string matches exactly once in its backup file.
// Also write the proposed new content to wp-backup/.../proposed/{slug}.txt for diff.
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { EDITS } from './wp-edits.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BACKUP_DIR = path.join(__dirname, 'wp-backup', '2026-04-22');
const PROPOSED_DIR = path.join(BACKUP_DIR, 'proposed');
await fs.mkdir(PROPOSED_DIR, { recursive: true });

let allOk = true;
for (const [slug, { id, edits }] of Object.entries(EDITS)) {
  console.log(`\n=== ${slug} (id=${id}) ===`);
  const filepath = path.join(BACKUP_DIR, `${slug}-editor-content.txt`);
  let content = await fs.readFile(filepath, 'utf8');
  let ok = true;
  for (const edit of edits) {
    const count = content.split(edit.find).length - 1;
    if (count === 1) {
      console.log(`  ✅ ${edit.name}: 1 match`);
      content = content.replace(edit.find, edit.replace);
    } else if (count === 0) {
      console.log(`  ❌ ${edit.name}: NO MATCH`);
      console.log(`     find(first 100): ${edit.find.slice(0,100)}`);
      ok = false;
    } else {
      console.log(`  ⚠️  ${edit.name}: ${count} matches (expected 1)`);
      ok = false;
    }
  }
  if (ok) {
    await fs.writeFile(path.join(PROPOSED_DIR, `${slug}.txt`), content);
    console.log(`  → proposed/${slug}.txt written (${content.length} chars)`);
  } else {
    allOk = false;
  }
}

if (allOk) {
  console.log('\nALL EDITS MATCHED. Ready to apply via wp-apply.mjs.');
} else {
  console.log('\nSOME EDITS FAILED. Fix wp-edits.mjs before applying.');
  process.exit(1);
}
