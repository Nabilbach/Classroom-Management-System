const fs = require('fs');
const path = require('path');
const glob = require('glob');

function decodeEscapedBytesInString(s) {
  // Find runs like \u00d8\u00a7\u00d9\u201e and decode pairs of \u00xx into bytes
  return s.replace(/(?:\\u00[0-9a-fA-F]{2})+/g, (match) => {
    // extract hex bytes
    const parts = match.match(/\\u00([0-9a-fA-F]{2})/g).map(p => p.slice(4));
    const bytes = Buffer.from(parts.map(h => parseInt(h, 16)));
    try {
      const decoded = bytes.toString('utf8');
      // Heuristic: only replace if decoded contains Arabic-range characters
      if (/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/.test(decoded)) {
        return decoded;
      }
      // else keep original
      return match;
    } catch (e) {
      return match;
    }
  });
}

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const newContent = decodeEscapedBytesInString(content);
  if (newContent !== content) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log('Updated', filePath);
    return true;
  }
  return false;
}

function main() {
  const patterns = ['src/**/*.tsx', 'src/**/*.ts', 'src/**/*.jsx', 'src/**/*.js'];
  const files = patterns.flatMap(pattern => glob.sync(pattern, { nodir: true }));
  const updated = [];
  for (const f of files) {
    try {
      if (processFile(f)) updated.push(f);
    } catch (err) {
      console.error('Failed', f, err.message);
    }
  }
  console.log('Done. Updated', updated.length, 'files');
}

main();
