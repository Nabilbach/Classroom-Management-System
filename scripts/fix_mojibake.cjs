const fs = require('fs');
const glob = require('glob');

function looksLikeArabic(s) {
  return /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/.test(s);
}

function fixFile(fp) {
  const orig = fs.readFileSync(fp, 'utf8');
  // reinterpret the UTF-8 decoded characters as latin1 bytes, then decode as UTF-8
  const buf = Buffer.from(orig, 'latin1');
  const fixed = buf.toString('utf8');
  // Only replace if fixed contains Arabic and orig does not (to avoid accidental changes)
  if (fixed !== orig && looksLikeArabic(fixed) && !looksLikeArabic(orig)) {
    fs.writeFileSync(fp, fixed, 'utf8');
    console.log('Fixed mojibake ->', fp);
    return true;
  }
  return false;
}

function main() {
  const patterns = ['src/**/*.ts', 'src/**/*.tsx', 'src/**/*.js', 'src/**/*.jsx'];
  const files = patterns.flatMap(p => glob.sync(p, { nodir: true }));
  const updated = [];
  for (const f of files) {
    try {
      if (fixFile(f)) updated.push(f);
    } catch (e) {
      console.error('err', f, e && e.message);
    }
  }
  console.log('Done. Updated', updated.length, 'files');
}

main();
