#!/usr/bin/env node

/**
 * Test: Textbook Input Focus Fix
 * Verifies that the fixes for input focus issues are in place
 */

const fs = require('fs');
const path = require('path');

console.log('\n🧪 Testing Textbook Input Focus Fixes\n');
console.log('='.repeat(60));

// Test files
const testFiles = [
  'src/components/TextbookEditModal.tsx',
  'src/components/TextbookEditModal_fixed.tsx',
  'src/components/EditLessonModal.tsx'
];

let passCount = 0;
let failCount = 0;

// Check each file
testFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`\n❌ File not found: ${file}`);
    failCount++;
    return;
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  
  // Different checks for different files
  let checks = {
    'Has useEffect': content.includes('useEffect'),
    'Checks for open state': content.includes('if (!open)'),
    'Scrollbar styling': content.includes('&::-webkit-scrollbar'),
  };

  // File-specific checks
  if (file.includes('DialogContent')) {
    checks['DialogContent styling'] = content.includes('overflow: \'auto\'');
    checks['AccordionDetails display'] = content.includes('display: \'block\'');
  } else if (file.includes('EditLessonModal')) {
    checks['Modal styling'] = content.includes('&::-webkit-scrollbar');
    checks['Modal display'] = content.includes('maxHeight:');
  }

  console.log(`\n📄 File: ${file}`);
  
  let filePass = true;
  Object.entries(checks).forEach(([check, result]) => {
    const icon = result ? '✅' : '❌';
    console.log(`   ${icon} ${check}`);
    if (!result) filePass = false;
  });

  if (filePass) {
    console.log(`   ✅ All checks passed!`);
    passCount++;
  } else {
    console.log(`   ⚠️  Some checks failed`);
    failCount++;
  }
});

console.log('\n' + '='.repeat(60));
console.log(`\n📊 Test Results:`);
console.log(`   ✅ Passed: ${passCount}`);
console.log(`   ❌ Failed: ${failCount}`);
console.log(`   📈 Total: ${testFiles.length}`);

if (failCount === 0) {
  console.log('\n✅ All tests PASSED! Fixes are in place.\n');
  process.exit(0);
} else {
  console.log('\n⚠️  Some tests FAILED. Please review the fixes.\n');
  process.exit(1);
}
